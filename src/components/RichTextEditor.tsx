import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Link, 
  Image as ImageIcon,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Maximize2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';
import { apiClient, MediaFile, resolveAssetUrl } from '../services/api';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

type ImageSizePreset = 'small' | 'medium' | 'large' | 'full' | 'custom';

const IMAGE_SIZE_PERCENT: Record<Exclude<ImageSizePreset, 'custom'>, number> = {
  small: 40,
  medium: 65,
  large: 85,
  full: 100,
};

const IMAGE_SIZE_LABELS: Record<Exclude<ImageSizePreset, 'custom'>, string> = {
  small: 'Ntoya',
  medium: 'Hagati',
  large: 'Nini',
  full: 'Yuzuye',
};

interface PendingImage {
  url: string;
  alt: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = ""
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);
  const [showUrlInsertMenu, setShowUrlInsertMenu] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [urlPreviewHtml, setUrlPreviewHtml] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState(false);
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [studioCaption, setStudioCaption] = useState('');
  const [studioSize, setStudioSize] = useState<Exclude<ImageSizePreset, 'custom'>>('full');

  const normalizeImageUrl = (url: string) => resolveAssetUrl(url) || url;

  const sanitizeEditorHtmlForSave = (html: string) => {
    if (!html || typeof window === 'undefined') return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="editor-root">${html}</div>`, 'text/html');
    const root = doc.getElementById('editor-root');
    if (!root) return html;

    root.querySelectorAll('.resize-handle, .image-controls').forEach((node) => node.remove());

    root.querySelectorAll('.image-container').forEach((container) => {
      const image = container.querySelector('img');
      const parent = container.parentElement;
      if (image && parent) {
        parent.insertBefore(image, container);
      }
      container.remove();
    });

    root.querySelectorAll('.selected').forEach((node) => node.classList.remove('selected'));

    root.querySelectorAll('figcaption.umunsi-caption').forEach((caption) => {
      if (!caption.textContent?.trim()) {
        caption.remove();
      }
    });

    return root.innerHTML;
  };

  const getEditorMaxImageWidth = useCallback(() => {
    if (!editorRef.current) return 900;
    return Math.max(320, editorRef.current.clientWidth - 32);
  }, []);

  const wrapImageInFigure = (img: HTMLImageElement) => {
    if (img.closest('figure.umunsi-figure')) return;

    const doc = img.ownerDocument;
    const figure = doc.createElement('figure');
    figure.className = 'umunsi-figure image-text-block';
    figure.setAttribute('data-size', 'full');

    const figcaption = doc.createElement('figcaption');
    figcaption.className = 'umunsi-caption umunsi-caption-empty';
    figcaption.setAttribute('contenteditable', 'true');
    figcaption.setAttribute('data-placeholder', 'Andika caption y\'ifoto hano...');

    const parent = img.parentElement;
    if (!parent) return;

    parent.insertBefore(figure, img);
    figure.appendChild(img);
    figure.appendChild(figcaption);

    if (parent.classList.contains('image-text-block') && parent !== figure && parent.children.length === 0) {
      parent.remove();
    }
  };

  const prepareEditorHtmlForDisplay = (html: string) => {
    if (!html || typeof window === 'undefined') return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div id="editor-root">${html}</div>`, 'text/html');
    const root = doc.getElementById('editor-root');
    if (!root) return html;

    root.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const resolved = resolveAssetUrl(src);
      if (resolved) {
        img.setAttribute('src', resolved);
        img.setAttribute('data-original-src', src);
      }
      img.classList.add('resizable-image');
      img.setAttribute('loading', 'lazy');

      if (!img.closest('figure.umunsi-figure')) {
        wrapImageInFigure(img);
      }

      const figure = img.closest('figure.umunsi-figure') as HTMLElement | null;
      if (figure && !figure.querySelector('figcaption')) {
        const figcaption = doc.createElement('figcaption');
        figcaption.className = 'umunsi-caption umunsi-caption-empty';
        figcaption.setAttribute('contenteditable', 'true');
        figcaption.setAttribute('data-placeholder', 'Andika caption y\'ifoto hano...');
        figure.appendChild(figcaption);
      }

      if (figure && !figure.getAttribute('data-size')) {
        figure.setAttribute('data-size', 'full');
      }

      const figcaption = figure?.querySelector('figcaption.umunsi-caption');
      if (figcaption && !figcaption.textContent?.trim()) {
        figcaption.classList.add('umunsi-caption-empty');
      }
    });

    return root.innerHTML;
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = prepareEditorHtmlForDisplay(value);
      setTimeout(() => {
        addImageResizeHandles();
      }, 100);
    }
  }, [value]);

  useEffect(() => {
    // Add resize handles when component mounts
    setTimeout(() => {
      addImageResizeHandles();
    }, 100);
  }, []);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(sanitizeEditorHtmlForSave(editorRef.current.innerHTML));
    }
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const sanitizePastedHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('script, style, meta, link').forEach((node) => node.remove());

    const blockedAttributes = [
      'style',
      'bgcolor',
      'color',
      'face',
      'size',
      'width',
      'height',
      'align',
      'valign'
    ];

    doc.body.querySelectorAll('*').forEach((element) => {
      blockedAttributes.forEach((attr) => {
        if (element.hasAttribute(attr)) {
          element.removeAttribute(attr);
        }
      });

      if (element.hasAttribute('class')) {
        element.removeAttribute('class');
      }

      if (element.tagName === 'SPAN' && element.attributes.length === 0) {
        const parent = element.parentNode;
        while (element.firstChild) {
          parent?.insertBefore(element.firstChild, element);
        }
        parent?.removeChild(element);
      }
    });

    return doc.body.innerHTML;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      const cleanedHtml = sanitizePastedHtml(html);
      document.execCommand('insertHTML', false, cleanedHtml);
    } else if (text) {
      const safeText = escapeHtml(text).replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, safeText);
    }

    handleContentChange();
  };

  const handleDroppedImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('files', file);
      const uploaded = await apiClient.uploadMediaFiles(formData);
      const uploadedFile = uploaded[0];
      if (!uploadedFile) {
        alert('Upload failed. Please try again.');
        return;
      }
      const imageUrl = normalizeImageUrl(uploadedFile.url);
      openImageStudio(imageUrl, uploadedFile.originalName || file.name);
    } catch (error) {
      console.error('Failed to upload dropped image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    // Handle image file drops first
    if (e.dataTransfer.files.length > 0) {
      const imageFile = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
      if (imageFile) {
        e.preventDefault();
        handleDroppedImage(imageFile);
        return;
      }
    }

    e.preventDefault();
    const html = e.dataTransfer.getData('text/html');
    const text = e.dataTransfer.getData('text/plain');

    if (html) {
      const cleanedHtml = sanitizePastedHtml(html);
      document.execCommand('insertHTML', false, cleanedHtml);
    } else if (text) {
      const safeText = escapeHtml(text).replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, safeText);
    }

    handleContentChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('redo');
          } else {
            execCommand('undo');
          }
          break;
      }
    }
  };

  const openImageStudio = (imageUrl: string, alt: string) => {
    setPendingImage({ url: imageUrl, alt });
    setStudioCaption('');
    setStudioSize('full');
    setShowImageStudio(true);
    setShowImageSourceMenu(false);
    setShowMediaLibrary(false);
  };

  const closeImageStudio = () => {
    setShowImageStudio(false);
    setPendingImage(null);
    setStudioCaption('');
    setStudioSize('full');
  };

  const insertImageBlock = (
    imageUrl: string,
    defaultAlt: string = 'Inserted image',
    caption: string = '',
    size: Exclude<ImageSizePreset, 'custom'> = 'full'
  ) => {
    const safeImageUrl = escapeHtml(imageUrl);
    const safeAlt = escapeHtml(defaultAlt);
    const widthPercent = IMAGE_SIZE_PERCENT[size];
    const trimmedCaption = caption.trim();
    const captionHtml = trimmedCaption
      ? `<figcaption class="umunsi-caption" contenteditable="true">${escapeHtml(trimmedCaption)}</figcaption>`
      : `<figcaption class="umunsi-caption umunsi-caption-empty" contenteditable="true" data-placeholder="Andika caption y'ifoto hano..."></figcaption>`;

    const imageBlockHtml = `
      <figure class="umunsi-figure image-text-block" data-size="${size}">
        <img src="${safeImageUrl}" alt="${safeAlt}" class="resizable-image" style="width: ${widthPercent}%; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; display: block; margin: 0 auto;" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, imageBlockHtml);
    editorRef.current?.focus();
    handleContentChange();
    setTimeout(() => {
      addImageResizeHandles();
    }, 100);
  };

  const confirmImageStudioInsert = () => {
    if (!pendingImage) return;
    insertImageBlock(pendingImage.url, pendingImage.alt, studioCaption, studioSize);
    closeImageStudio();
  };

  const chooseImageFromLibrary = () => {
    setShowImageSourceMenu(false);
    setShowMediaLibrary(true);
  };

  const chooseImageFromComputer = () => {
    setShowImageSourceMenu(false);
    fileInputRef.current?.click();
  };

  // Also close image menu when clicking outside
  useEffect(() => {
    if (!showImageSourceMenu && !showUrlInsertMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.rich-text-editor')) {
        setShowImageSourceMenu(false);
        setShowUrlInsertMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showImageSourceMenu, showUrlInsertMenu]);

  const handleMediaSelect = (media: MediaFile) => {
    const imageUrl = normalizeImageUrl(media.url);
    openImageStudio(imageUrl, media.originalName || 'Inserted image');
  };

  const handleComputerFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('files', file);
      const uploaded = await apiClient.uploadMediaFiles(formData);
      const uploadedFile = uploaded[0];

      if (!uploadedFile) {
        alert('Upload failed. Please try again.');
        return;
      }

      const imageUrl = normalizeImageUrl(uploadedFile.url);
      openImageStudio(imageUrl, uploadedFile.originalName || file.name);
    } catch (error) {
      console.error('Failed to upload selected image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const insertLink = () => {
    setShowUrlInsertMenu((prev) => !prev);
    setShowImageSourceMenu(false);
  };

  const getYouTubeVideoId = (url: string) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        return parsed.pathname.split('/').filter(Boolean)[0] || null;
      }

      if (host.includes('youtube.com')) {
        const id = parsed.searchParams.get('v');
        if (id) return id;

        const parts = parsed.pathname.split('/').filter(Boolean);
        const markerIndex = parts.findIndex((part) => part === 'embed' || part === 'shorts');
        if (markerIndex !== -1 && parts[markerIndex + 1]) {
          return parts[markerIndex + 1];
        }
      }
    } catch {
      return null;
    }

    return null;
  };

  const buildEmbedHtmlFromUrl = (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return '';

    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.umunsi.com';
      const params = `rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(origin)}`;
      return `
        <div class="not-prose my-6 overflow-hidden rounded-xl border border-[#2b2f36] bg-[#0b0e11]">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${youtubeId}?${params}"
            title="YouTube video"
            class="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
        </div>
      `;
    }

    if (/(^https?:\/\/)?(www\.)?instagram\.com\//i.test(url)) {
      return `
        <blockquote class="instagram-media not-prose my-6" data-instgrm-permalink="${url}" data-instgrm-version="14">
          <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
        </blockquote>
      `;
    }

    if (/(^https?:\/\/)?(www\.)?(x\.com|twitter\.com)\//i.test(url)) {
      return `
        <blockquote class="twitter-tweet not-prose my-6">
          <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
        </blockquote>
      `;
    }

    return `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>`;
  };

  const handleGenerateUrlPreview = () => {
    const embed = buildEmbedHtmlFromUrl(urlInputValue);
    setUrlPreviewHtml(embed || '<p class="text-gray-400">Invalid URL</p>');
    setUrlPreviewValid(Boolean(embed));
  };

  const handleInsertUrlEmbed = () => {
    const embed = buildEmbedHtmlFromUrl(urlInputValue);
    if (!embed) return;

    document.execCommand('insertHTML', false, `${embed}<p><br></p>`);
    editorRef.current?.focus();
    handleContentChange();
    setShowUrlInsertMenu(false);
    setUrlInputValue('');
    setUrlPreviewHtml('');
    setUrlPreviewValid(false);
  };

  const addImageResizeHandles = () => {
    if (!editorRef.current) return;

    const images = editorRef.current.querySelectorAll('.resizable-image');
    images.forEach((img: Element) => {
      const imageElement = img as HTMLImageElement;
      
      if (imageElement.parentElement?.classList.contains('image-container')) return;

      const container = document.createElement('div');
      container.className = 'image-container';
      container.style.position = 'relative';
      container.style.display = 'block';
      container.style.maxWidth = '100%';
      container.style.width = 'fit-content';
      container.style.margin = '0 auto';

      imageElement.parentNode?.insertBefore(container, imageElement);
      container.appendChild(imageElement);

      addResizeHandles(container, imageElement);
      
      imageElement.addEventListener('click', (e) => {
        e.preventDefault();
        selectImage(container);
      });
    });

    editorRef.current.querySelectorAll('figcaption.umunsi-caption').forEach((caption) => {
      caption.addEventListener('input', () => {
        if (caption.textContent?.trim()) {
          caption.classList.remove('umunsi-caption-empty');
        } else {
          caption.classList.add('umunsi-caption-empty');
        }
        handleContentChange();
      });
    });
  };

  const getFigureForImage = (image: HTMLImageElement) =>
    image.closest('figure.umunsi-figure') as HTMLElement | null;

  const applyImageSizePreset = (image: HTMLImageElement, size: Exclude<ImageSizePreset, 'custom'>) => {
    const figure = getFigureForImage(image);
    const widthPercent = IMAGE_SIZE_PERCENT[size];

    if (figure) {
      figure.setAttribute('data-size', size);
    }

    image.style.width = `${widthPercent}%`;
    image.style.height = 'auto';
    image.style.maxWidth = '100%';
    handleContentChange();
  };

  const editImageCaption = (image: HTMLImageElement) => {
    const figure = getFigureForImage(image);
    if (!figure) return;

    let caption = figure.querySelector('figcaption.umunsi-caption') as HTMLElement | null;
    if (!caption) {
      caption = document.createElement('figcaption');
      caption.className = 'umunsi-caption umunsi-caption-empty';
      caption.setAttribute('contenteditable', 'true');
      caption.setAttribute('data-placeholder', 'Andika caption y\'ifoto hano...');
      figure.appendChild(caption);
    }

    caption.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(caption);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const addResizeHandles = (container: HTMLElement, image: HTMLImageElement) => {
    const handles = ['nw', 'ne', 'sw', 'se', 'e'] as const;
    
    handles.forEach((handle) => {
      const resizeHandle = document.createElement('div');
      resizeHandle.className = `resize-handle resize-handle-${handle}`;
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.backgroundColor = '#fcd535';
      resizeHandle.style.border = '2px solid #0b0e11';
      resizeHandle.style.cursor = handle === 'e' ? 'ew-resize' : `${handle}-resize`;
      resizeHandle.style.zIndex = '1000';
      resizeHandle.style.opacity = '0';
      resizeHandle.style.transition = 'opacity 0.2s';
      resizeHandle.style.borderRadius = '50%';

      if (handle === 'e') {
        resizeHandle.style.width = '14px';
        resizeHandle.style.height = '14px';
        resizeHandle.style.right = '-7px';
        resizeHandle.style.top = '50%';
        resizeHandle.style.transform = 'translateY(-50%)';
      } else {
        resizeHandle.style.width = '12px';
        resizeHandle.style.height = '12px';
        switch (handle) {
          case 'nw':
            resizeHandle.style.top = '-6px';
            resizeHandle.style.left = '-6px';
            break;
          case 'ne':
            resizeHandle.style.top = '-6px';
            resizeHandle.style.right = '-6px';
            break;
          case 'sw':
            resizeHandle.style.bottom = '-6px';
            resizeHandle.style.left = '-6px';
            break;
          case 'se':
            resizeHandle.style.bottom = '-6px';
            resizeHandle.style.right = '-6px';
            break;
        }
      }

      container.appendChild(resizeHandle);

      let isResizing = false;
      let startX = 0;
      let startWidth = 0;
      let aspectRatio = 1;

      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startWidth = image.offsetWidth;
        aspectRatio = startWidth / Math.max(image.offsetHeight, 1);

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
      });

      const handleResize = (e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        let newWidth = startWidth;

        switch (handle) {
          case 'se':
          case 'ne':
          case 'e':
            newWidth = startWidth + deltaX;
            break;
          case 'sw':
          case 'nw':
            newWidth = startWidth - deltaX;
            break;
        }

        const minSize = 80;
        const maxSize = getEditorMaxImageWidth();
        newWidth = Math.max(minSize, Math.min(maxSize, newWidth));

        image.style.width = `${newWidth}px`;
        image.style.height = `${Math.round(newWidth / aspectRatio)}px`;
        image.style.maxWidth = '100%';

        const figure = getFigureForImage(image);
        if (figure) {
          figure.setAttribute('data-size', 'custom');
        }
      };

      const stopResize = () => {
        if (isResizing) {
          image.style.height = 'auto';
          handleContentChange();
        }
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      };
    });

    addImageControls(container, image);
  };

  const addImageControls = (container: HTMLElement, image: HTMLImageElement) => {
    const controls = document.createElement('div');
    controls.className = 'image-controls';
    controls.style.position = 'absolute';
    controls.style.top = '-36px';
    controls.style.left = '50%';
    controls.style.transform = 'translateX(-50%)';
    controls.style.backgroundColor = '#1e2329';
    controls.style.border = '1px solid #fcd535';
    controls.style.color = 'white';
    controls.style.padding = '6px 10px';
    controls.style.borderRadius = '999px';
    controls.style.fontSize = '11px';
    controls.style.opacity = '0';
    controls.style.transition = 'opacity 0.2s';
    controls.style.zIndex = '1001';
    controls.style.display = 'flex';
    controls.style.gap = '6px';
    controls.style.alignItems = 'center';
    controls.style.flexWrap = 'wrap';
    controls.style.maxWidth = 'min(100vw, 520px)';
    controls.style.whiteSpace = 'nowrap';

    const sizeGroup = document.createElement('div');
    sizeGroup.style.display = 'flex';
    sizeGroup.style.gap = '4px';
    sizeGroup.style.alignItems = 'center';
    sizeGroup.style.borderRight = '1px solid #2b2f36';
    sizeGroup.style.paddingRight = '6px';
    sizeGroup.style.marginRight = '2px';

    (Object.keys(IMAGE_SIZE_LABELS) as Array<Exclude<ImageSizePreset, 'custom'>>).forEach((size) => {
      const btn = createControlButton(IMAGE_SIZE_LABELS[size], `Set ${IMAGE_SIZE_LABELS[size]}`, () => applyImageSizePreset(image, size));
      btn.style.fontSize = '10px';
      btn.style.fontWeight = '600';
      btn.style.padding = '2px 6px';
      btn.style.borderRadius = '999px';
      btn.style.backgroundColor = 'rgba(252, 213, 53, 0.12)';
      sizeGroup.appendChild(btn);
    });

    controls.appendChild(sizeGroup);
    controls.appendChild(createControlButton('📝', 'Edit Caption', () => editImageCaption(image)));
    controls.appendChild(createControlButton('↑', 'Move Up', () => moveImage(container, 'up')));
    controls.appendChild(createControlButton('↓', 'Move Down', () => moveImage(container, 'down')));
    controls.appendChild(createControlButton('⬅', 'Align Left', () => alignImage(image, 'left')));
    controls.appendChild(createControlButton('⬆', 'Center', () => alignImage(image, 'center')));
    controls.appendChild(createControlButton('➡', 'Align Right', () => alignImage(image, 'right')));
    controls.appendChild(createControlButton('🗑', 'Delete Image', () => deleteImage(container)));

    container.appendChild(controls);
  };

  const createControlButton = (icon: string, title: string, onClick: () => void) => {
    const button = document.createElement('button');
    button.innerHTML = icon;
    button.title = title;
    button.style.background = 'none';
    button.style.border = 'none';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.padding = '2px';
    button.style.borderRadius = '2px';
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(255,255,255,0.2)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
    });
    return button;
  };

  const selectImage = (container: HTMLElement) => {
    // Remove selection from other images
    const allContainers = editorRef.current?.querySelectorAll('.image-container');
    allContainers?.forEach(c => {
      c.classList.remove('selected');
      const handles = c.querySelectorAll('.resize-handle');
      const controls = c.querySelector('.image-controls') as HTMLElement;
      handles.forEach(h => (h as HTMLElement).style.opacity = '0');
      if (controls) controls.style.opacity = '0';
    });

    // Select current image
    container.classList.add('selected');
    const handles = container.querySelectorAll('.resize-handle');
    const controls = container.querySelector('.image-controls') as HTMLElement;
    handles.forEach(h => (h as HTMLElement).style.opacity = '1');
    if (controls) controls.style.opacity = '1';
  };

  const alignImage = (image: HTMLImageElement, alignment: string) => {
    const container = image.parentElement;
    const figure = getFigureForImage(image);
    if (!container) return;

    container.classList.remove('align-left', 'align-center', 'align-right');
    container.classList.add(`align-${alignment}`);
    
    switch (alignment) {
      case 'left':
        container.style.margin = '0 auto 0 0';
        if (figure) figure.style.textAlign = 'left';
        break;
      case 'center':
        container.style.margin = '0 auto';
        if (figure) figure.style.textAlign = 'center';
        break;
      case 'right':
        container.style.margin = '0 0 0 auto';
        if (figure) figure.style.textAlign = 'right';
        break;
    }
    handleContentChange();
  };

  const isEmptyPlaceholder = (element: Element | null) => {
    if (!element || !(element instanceof HTMLElement)) return false;

    if (element.classList.contains('image-text-block')) {
      return element.querySelector('.resizable-image') === null && element.textContent?.trim() === '';
    }

    if (element.tagName === 'P') {
      const html = element.innerHTML.replace(/\s+/g, '').toLowerCase();
      return html === '' || html === '<br>' || html === '<br/>';
    }

    return false;
  };

  const isImageBlock = (element: Element | null) => {
    if (!element || !(element instanceof HTMLElement)) return false;
    if (element.classList.contains('image-text-block') || element.classList.contains('umunsi-figure')) {
      return element.querySelector('.resizable-image') !== null;
    }

    return (
      element.classList.contains('image-container') ||
      element.querySelector('.image-container, .resizable-image') !== null
    );
  };

  const clearAdjacentPlaceholders = (target: HTMLElement) => {
    const previous = target.previousElementSibling;
    const next = target.nextElementSibling;

    if (isEmptyPlaceholder(previous)) previous?.remove();
    if (isEmptyPlaceholder(next)) next?.remove();
  };

  const getSiblingImageBlock = (target: HTMLElement, direction: 'up' | 'down') => {
    let removedPlaceholder = false;
    let sibling = direction === 'up' ? target.previousElementSibling : target.nextElementSibling;

    while (sibling && isEmptyPlaceholder(sibling)) {
      const toRemove = sibling;
      sibling = direction === 'up' ? sibling.previousElementSibling : sibling.nextElementSibling;
      toRemove.remove();
      removedPlaceholder = true;
    }

    if (sibling && !isImageBlock(sibling)) {
      return { sibling: null as HTMLElement | null, removedPlaceholder };
    }

    return { sibling: (sibling as HTMLElement | null), removedPlaceholder };
  };

  const moveImage = (container: HTMLElement, direction: 'up' | 'down') => {
    const target = (container.closest('.umunsi-figure, .image-text-block') as HTMLElement | null) || container;
    const parent = target.parentElement;
    if (!parent) return;

    if (direction === 'up') {
      const { sibling: previous, removedPlaceholder } = getSiblingImageBlock(target, 'up');
      if (!previous) {
        if (removedPlaceholder) handleContentChange();
        return;
      }
      if (!previous) return;
      parent.insertBefore(target, previous);
    } else {
      const { sibling: next, removedPlaceholder } = getSiblingImageBlock(target, 'down');
      if (!next) {
        if (removedPlaceholder) handleContentChange();
        return;
      }
      if (!next) return;
      parent.insertBefore(target, next.nextElementSibling);
    }

    clearAdjacentPlaceholders(target);
    selectImage(container);
    handleContentChange();
  };

  const deleteImage = (container: HTMLElement) => {
    if (confirm('Are you sure you want to delete this image?')) {
      const target = (container.closest('.umunsi-figure, .image-text-block') as HTMLElement | null) || container;
      const parent = target.parentElement;
      const nextSibling = target.nextElementSibling as HTMLElement | null;
      const previousSibling = target.previousElementSibling as HTMLElement | null;

      target.remove();

      let cursorParent = parent;

      if (cursorParent) {
        if (previousSibling && isEmptyPlaceholder(previousSibling)) {
          previousSibling.remove();
        }
        if (nextSibling && isEmptyPlaceholder(nextSibling)) {
          nextSibling.remove();
        }

        // Remove empty wrapper paragraph/div left behind by deleting nested image containers.
        if (cursorParent !== editorRef.current && isEmptyPlaceholder(cursorParent)) {
          const wrapperParent = cursorParent.parentElement as HTMLElement | null;
          cursorParent.remove();
          cursorParent = wrapperParent;
        }
      }

      if (cursorParent) {

        // Keep at least one editable block so typing/inserting can continue immediately.
        if (!cursorParent.firstElementChild) {
          const placeholderParagraph = document.createElement('p');
          placeholderParagraph.innerHTML = '<br>';
          cursorParent.appendChild(placeholderParagraph);
        }

        const targetElement =
          (nextSibling && nextSibling.isConnected ? nextSibling : null) ||
          (previousSibling && previousSibling.isConnected ? previousSibling : null) ||
          (cursorParent.lastElementChild as HTMLElement | null);
        if (targetElement && editorRef.current) {
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(targetElement);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          editorRef.current.focus();
        }
      }

      handleContentChange();
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    isActive?: boolean;
  }> = ({ onClick, icon, title, isActive = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-[#2b2f36] transition-colors ${
        isActive ? 'bg-[#2b2f36] text-[#fcd535]' : 'text-gray-400 hover:text-white'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className={`rich-text-editor border border-[#2b2f36] rounded-xl bg-[#0b0e11] ${className}`}>
      {/* Toolbar */}
      <div className="relative flex items-center gap-1 p-2 border-b border-[#2b2f36] bg-[#1e2329] rounded-t-xl">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-[#2b2f36] pr-2">
          <ToolbarButton
            onClick={() => execCommand('bold')}
            icon={<Bold className="w-4 h-4" />}
            title="Bold (Ctrl+B)"
          />
          <ToolbarButton
            onClick={() => execCommand('italic')}
            icon={<Italic className="w-4 h-4" />}
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton
            onClick={() => execCommand('underline')}
            icon={<Underline className="w-4 h-4" />}
            title="Underline (Ctrl+U)"
          />
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-[#2b2f36] pr-2">
          <ToolbarButton
            onClick={() => execCommand('insertUnorderedList')}
            icon={<List className="w-4 h-4" />}
            title="Bullet List"
          />
          <ToolbarButton
            onClick={() => execCommand('insertOrderedList')}
            icon={<ListOrdered className="w-4 h-4" />}
            title="Numbered List"
          />
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-[#2b2f36] pr-2">
          <ToolbarButton
            onClick={() => execCommand('justifyLeft')}
            icon={<AlignLeft className="w-4 h-4" />}
            title="Align Left"
          />
          <ToolbarButton
            onClick={() => execCommand('justifyCenter')}
            icon={<AlignCenter className="w-4 h-4" />}
            title="Align Center"
          />
          <ToolbarButton
            onClick={() => execCommand('justifyRight')}
            icon={<AlignRight className="w-4 h-4" />}
            title="Align Right"
          />
        </div>

        {/* Insert */}
        <div className="flex items-center gap-1 border-r border-[#2b2f36] pr-2">
          {/* Link button with relative dropdown */}
          <div className="relative">
            <ToolbarButton
              onClick={insertLink}
              icon={<Link className="w-4 h-4" />}
              title="Insert Link / YouTube / Instagram"
              isActive={showUrlInsertMenu}
            />
            {showUrlInsertMenu && (
              <div className="absolute top-10 left-0 z-30 bg-[#0b0e11] border border-[#2b2f36] rounded-lg shadow-xl p-3 w-[340px] sm:w-[380px]">
                <p className="text-xs text-gray-400 mb-2">Insert URL (YouTube, Instagram, X/Twitter or normal link)</p>
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setUrlInputValue(nextValue);
                    const nextPreview = buildEmbedHtmlFromUrl(nextValue);
                    setUrlPreviewHtml(nextPreview || (nextValue.trim() ? '<p class="text-gray-400">Invalid URL</p>' : ''));
                    setUrlPreviewValid(Boolean(nextPreview));
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded bg-[#11151b] border border-[#2b2f36] text-sm text-gray-100"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateUrlPreview}
                    className="px-3 py-1.5 rounded bg-[#2b2f36] text-gray-200 text-xs"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertUrlEmbed}
                    disabled={!urlPreviewValid}
                    className="px-3 py-1.5 rounded bg-[#fcd535] text-[#0b0e11] font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Insert in Article
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowUrlInsertMenu(false); setUrlInputValue(''); setUrlPreviewHtml(''); setUrlPreviewValid(false); }}
                    className="px-3 py-1.5 rounded bg-[#2b2f36] text-gray-400 text-xs ml-auto"
                  >
                    ✕
                  </button>
                </div>
                {urlPreviewHtml && (
                  <div className="mt-3 border border-[#2b2f36] rounded p-2 max-h-52 overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: urlPreviewHtml }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image button — prominent, with relative dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowImageSourceMenu((prev) => !prev)}
              title="Insert Image (from library or computer)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showImageSourceMenu
                  ? 'bg-[#fcd535] text-[#0b0e11]'
                  : 'bg-[#fcd535]/15 text-[#fcd535] hover:bg-[#fcd535]/25 border border-[#fcd535]/40'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Add Image</span>
            </button>
            {showImageSourceMenu && (
              <div className="absolute top-10 left-0 z-20 bg-[#0b0e11] border border-[#2b2f36] rounded-lg shadow-xl p-2 min-w-[210px]">
                <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider px-3 py-1">Choose source</p>
                <button
                  type="button"
                  onClick={chooseImageFromLibrary}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded text-sm text-gray-200 hover:bg-[#1e2329]"
                >
                  <ImageIcon className="w-4 h-4 text-[#fcd535]" />
                  Media Library
                </button>
                <button
                  type="button"
                  onClick={chooseImageFromComputer}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded text-sm text-gray-200 hover:bg-[#1e2329]"
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                  Upload from Device
                </button>
              </div>
            )}
          </div>

          <ToolbarButton
            onClick={() => execCommand('formatBlock', 'blockquote')}
            icon={<Quote className="w-4 h-4" />}
            title="Quote"
          />
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => execCommand('undo')}
            icon={<Undo className="w-4 h-4" />}
            title="Undo (Ctrl+Z)"
          />
          <ToolbarButton
            onClick={() => execCommand('redo')}
            icon={<Redo className="w-4 h-4" />}
            title="Redo (Ctrl+Shift+Z)"
          />
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onPaste={handlePaste}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[300px] p-4 focus:outline-none text-white bg-[#0b0e11] transition-all ${
          isDragOver
            ? 'ring-2 ring-[#fcd535] bg-[#fcd535]/5'
            : isFocused
            ? 'ring-2 ring-[#fcd535]/50'
            : ''
        }`}
        style={{ minHeight: '300px', color: 'white' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Drag & Drop hint / Quick image insert bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#2b2f36] bg-[#1e2329] rounded-b-xl">
        <p className="text-xs text-gray-500">
          {isDragOver ? '📸 Drop image here to upload!' : 'Drag & drop images directly into the editor, or use the '}
          {!isDragOver && (
            <button
              type="button"
              onClick={() => setShowMediaLibrary(true)}
              className="text-[#fcd535] hover:underline"
            >
              Add Image
            </button>
          )}
          {!isDragOver && ' button above'}
        </p>
        <button
          type="button"
          onClick={() => setShowMediaLibrary(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fcd535] text-[#0b0e11] text-xs font-semibold rounded-lg hover:bg-[#f0b90b] transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Insert Image
        </button>
      </div>

      {/* Placeholder */}
      {!value && (
        <div className="absolute top-16 left-4 text-gray-500 pointer-events-none">
          {placeholder}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleComputerFileSelected}
        className="hidden"
      />

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
        title="Choose Uploaded Image"
        mode="select"
        type="image"
      />

      {showImageStudio && pendingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl rounded-2xl border border-[#2b2f36] bg-[#0b0e11] shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-studio-title"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2b2f36] bg-[#1e2329]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#fcd535]" />
                <div>
                  <h3 id="image-studio-title" className="text-sm font-bold text-white">Umunsi Image Studio</h3>
                  <p className="text-[11px] text-gray-400">Shyiraho caption &amp; ubunini — ibyerekeza abasomyi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeImageStudio}
                className="text-gray-400 hover:text-white px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="rounded-xl border border-[#2b2f36] bg-[#11151b] p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Preview — uko bizagaragara ku rubuga</p>
                <figure
                  className="umunsi-figure umunsi-figure-preview mx-auto"
                  data-size={studioSize}
                  style={{ maxWidth: `${IMAGE_SIZE_PERCENT[studioSize]}%` }}
                >
                  <img
                    src={pendingImage.url}
                    alt={pendingImage.alt}
                    className="rounded-lg shadow-lg w-full h-auto block"
                  />
                  {(studioCaption.trim() || true) && (
                    <figcaption className={`umunsi-caption ${studioCaption.trim() ? '' : 'umunsi-caption-empty'}`}>
                      {studioCaption.trim() || 'Andika caption y\'ifoto hano...'}
                    </figcaption>
                  )}
                </figure>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4 text-[#fcd535]" />
                  Caption y&apos;ifoto
                </label>
                <textarea
                  value={studioCaption}
                  onChange={(e) => setStudioCaption(e.target.value)}
                  placeholder="Urugero: Perezida na Minisitiri w'Ubucuruzi mu muhango wo gutanga ibihembo..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#11151b] border border-[#2b2f36] text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fcd535]/40 resize-none"
                  autoFocus
                />
                <p className="mt-1.5 text-[11px] text-gray-500">Caption igaragara munsi y&apos;ifoto ku rubuga — ibyoroshya abasomyi gusobanukirwa.</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-2">
                  <Maximize2 className="w-4 h-4 text-[#fcd535]" />
                  Ubunini bw&apos;ifoto
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(IMAGE_SIZE_LABELS) as Array<Exclude<ImageSizePreset, 'custom'>>).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setStudioSize(size)}
                      className={`relative px-3 py-3 rounded-xl border text-left transition-all ${
                        studioSize === size
                          ? 'border-[#fcd535] bg-[#fcd535]/10 text-[#fcd535]'
                          : 'border-[#2b2f36] bg-[#11151b] text-gray-300 hover:border-[#fcd535]/40'
                      }`}
                    >
                      <span className="block text-xs font-bold">{IMAGE_SIZE_LABELS[size]}</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">{IMAGE_SIZE_PERCENT[size]}%</span>
                      <span
                        className={`absolute bottom-2 right-2 h-1.5 rounded-full bg-[#fcd535]/60 ${
                          size === 'small' ? 'w-[35%]' : size === 'medium' ? 'w-[55%]' : size === 'large' ? 'w-[75%]' : 'w-full'
                        }`}
                        style={{ maxWidth: 'calc(100% - 16px)' }}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-gray-500">Nyuma yo gushyiramo, kanda ifoto mu mwandiko — ufata imipaka y&apos;umuhondo cyangwa ukoreshe ibyiciro.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#2b2f36] bg-[#1e2329]">
              <button
                type="button"
                onClick={closeImageStudio}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
              >
                Hagarika
              </button>
              <button
                type="button"
                onClick={confirmImageStudioInsert}
                className="px-5 py-2 rounded-lg bg-[#fcd535] text-[#0b0e11] text-sm font-bold hover:bg-[#f0b90b] transition-colors"
              >
                Shyira mu nkuru
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RichTextEditor;
