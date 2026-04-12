import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Link, 
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';
import { apiClient, MediaFile } from '../services/api';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showImageSourceMenu, setShowImageSourceMenu] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      console.log('🔄 Setting editor content, value length:', value.length);
      editorRef.current.innerHTML = value;
      // Add resize handles to existing images
      setTimeout(() => {
        addImageResizeHandles();
      }, 100);
    }
  }, [value]);

  useEffect(() => {
    // Add resize handles when component mounts
    console.log('🚀 RichTextEditor mounted, editorRef:', editorRef.current);
    setTimeout(() => {
      addImageResizeHandles();
    }, 100);
  }, []);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const getServerBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace('/api', '');
  };

  const normalizeImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
    if (url.startsWith('/')) return `${getServerBaseUrl()}${url}`;
    return `${getServerBaseUrl()}/${url}`;
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      console.log('📝 Content changed, new content length:', content.length);
      console.log('📄 Content preview:', content.substring(0, 200) + (content.length > 200 ? '...' : ''));
      onChange(content);
    } else {
      console.error('❌ Editor ref is null in handleContentChange');
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

  const insertImageBlock = (imageUrl: string, defaultAlt: string = 'Inserted image') => {
    const inlineTextInput = prompt('Enter text below image (optional)') || '';
    const captionInput = prompt('Enter caption (optional)') || '';

    const safeImageUrl = escapeHtml(imageUrl);
    const safeInlineText = escapeHtml(inlineTextInput.trim());
    const safeCaption = escapeHtml(captionInput.trim());
    const safeAlt = escapeHtml(defaultAlt);

    const imageBlockHtml = `
      <div class="image-text-block" style="margin: 10px 0;">
        <img src="${safeImageUrl}" alt="${safeCaption || safeAlt}" class="resizable-image" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; display: block;" data-original-width="400" data-original-height="300" />
        ${safeInlineText ? `<p style="margin-top: 8px;">${safeInlineText}</p>` : ''}
        ${safeCaption ? `<p style="margin-top: 4px; font-size: 13px; color: #9ca3af;"><em>${safeCaption}</em></p>` : ''}
      </div>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, imageBlockHtml);
    editorRef.current?.focus();
    handleContentChange();
    setTimeout(() => {
      addImageResizeHandles();
    }, 100);
  };

  const chooseImageFromLibrary = () => {
    setShowImageSourceMenu(false);
    setShowMediaLibrary(true);
  };

  const chooseImageFromComputer = () => {
    setShowImageSourceMenu(false);
    fileInputRef.current?.click();
  };

  const handleMediaSelect = (media: MediaFile) => {
    const imageUrl = normalizeImageUrl(media.url);
    insertImageBlock(imageUrl, media.originalName || 'Inserted image');
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
      insertImageBlock(imageUrl, uploadedFile.originalName || file.name);
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
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const addImageResizeHandles = () => {
    if (!editorRef.current) return;

    const images = editorRef.current.querySelectorAll('.resizable-image');
    images.forEach((img: Element) => {
      const imageElement = img as HTMLImageElement;
      
      // Skip if already has resize handles
      if (imageElement.parentElement?.classList.contains('image-container')) return;

      // Create container
      const container = document.createElement('div');
      container.className = 'image-container';
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.style.maxWidth = '100%';

      // Wrap image in container
      imageElement.parentNode?.insertBefore(container, imageElement);
      container.appendChild(imageElement);

      // Add resize handles
      addResizeHandles(container, imageElement);
      
      // Add click handler for selection
      imageElement.addEventListener('click', (e) => {
        e.preventDefault();
        selectImage(container);
      });
    });
  };

  const addResizeHandles = (container: HTMLElement, image: HTMLImageElement) => {
    // Create resize handles
    const handles = ['nw', 'ne', 'sw', 'se'];
    
    handles.forEach(handle => {
      const resizeHandle = document.createElement('div');
      resizeHandle.className = `resize-handle resize-handle-${handle}`;
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.width = '8px';
      resizeHandle.style.height = '8px';
      resizeHandle.style.backgroundColor = '#007cba';
      resizeHandle.style.border = '1px solid #fff';
      resizeHandle.style.cursor = `${handle}-resize`;
      resizeHandle.style.zIndex = '1000';
      resizeHandle.style.opacity = '0';
      resizeHandle.style.transition = 'opacity 0.2s';

      // Position handles
      switch (handle) {
        case 'nw':
          resizeHandle.style.top = '-4px';
          resizeHandle.style.left = '-4px';
          break;
        case 'ne':
          resizeHandle.style.top = '-4px';
          resizeHandle.style.right = '-4px';
          break;
        case 'sw':
          resizeHandle.style.bottom = '-4px';
          resizeHandle.style.left = '-4px';
          break;
        case 'se':
          resizeHandle.style.bottom = '-4px';
          resizeHandle.style.right = '-4px';
          break;
      }

      container.appendChild(resizeHandle);

      // Add resize functionality
      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;

      resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = image.offsetWidth;
        startHeight = image.offsetHeight;

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
      });

      const handleResize = (e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        // Calculate new dimensions based on handle
        switch (handle) {
          case 'se':
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'sw':
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'ne':
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
            break;
          case 'nw':
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
            break;
        }

        // Maintain aspect ratio and set minimum size
        const minSize = 50;
        const maxSize = 800;
        newWidth = Math.max(minSize, Math.min(maxSize, newWidth));
        newHeight = Math.max(minSize, Math.min(maxSize, newHeight));

        // Apply new dimensions
        image.style.width = `${newWidth}px`;
        image.style.height = `${newHeight}px`;
        image.style.maxWidth = 'none';
      };

      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      };
    });

    // Add image controls
    addImageControls(container, image);
  };

  const addImageControls = (container: HTMLElement, image: HTMLImageElement) => {
    // Create controls bar
    const controls = document.createElement('div');
    controls.className = 'image-controls';
    controls.style.position = 'absolute';
    controls.style.top = '-30px';
    controls.style.left = '0';
    controls.style.backgroundColor = '#007cba';
    controls.style.color = 'white';
    controls.style.padding = '4px 8px';
    controls.style.borderRadius = '4px';
    controls.style.fontSize = '12px';
    controls.style.opacity = '0';
    controls.style.transition = 'opacity 0.2s';
    controls.style.zIndex = '1001';
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';

    // Add control buttons
    const moveUp = createControlButton('↑', 'Move Up', () => moveImage(container, 'up'));
    const moveDown = createControlButton('↓', 'Move Down', () => moveImage(container, 'down'));
    const alignLeft = createControlButton('⬅', 'Align Left', () => alignImage(image, 'left'));
    const alignCenter = createControlButton('⬆', 'Align Center', () => alignImage(image, 'center'));
    const alignRight = createControlButton('➡', 'Align Right', () => alignImage(image, 'right'));
    const deleteBtn = createControlButton('🗑', 'Delete Image', () => deleteImage(container));

    controls.appendChild(moveUp);
    controls.appendChild(moveDown);
    controls.appendChild(alignLeft);
    controls.appendChild(alignCenter);
    controls.appendChild(alignRight);
    controls.appendChild(deleteBtn);

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
    if (!container) return;

    // Remove existing alignment classes
    container.classList.remove('align-left', 'align-center', 'align-right');
    
    // Add new alignment
    container.classList.add(`align-${alignment}`);
    
    // Apply alignment styles
    switch (alignment) {
      case 'left':
        container.style.textAlign = 'left';
        break;
      case 'center':
        container.style.textAlign = 'center';
        break;
      case 'right':
        container.style.textAlign = 'right';
        break;
    }
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
    if (element.classList.contains('image-text-block')) {
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
    const target = (container.closest('.image-text-block') as HTMLElement | null) || container;
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
      const target = (container.closest('.image-text-block') as HTMLElement | null) || container;
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
          <ToolbarButton
            onClick={insertLink}
            icon={<Link className="w-4 h-4" />}
            title="Insert Link"
          />
          <ToolbarButton
            onClick={() => setShowImageSourceMenu((prev) => !prev)}
            icon={<ImageIcon className="w-4 h-4" />}
            title="Insert Image"
          />
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

        {showImageSourceMenu && (
          <div className="absolute top-12 left-[285px] z-20 bg-[#0b0e11] border border-[#2b2f36] rounded-lg shadow-xl p-2 min-w-[240px]">
            <button
              type="button"
              onClick={chooseImageFromLibrary}
              className="w-full text-left px-3 py-2 rounded text-sm text-gray-200 hover:bg-[#1e2329]"
            >
              Choose Uploaded Image
            </button>
            <button
              type="button"
              onClick={chooseImageFromComputer}
              className="w-full text-left px-3 py-2 rounded text-sm text-gray-200 hover:bg-[#1e2329]"
            >
              Choose from Computer
            </button>
          </div>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[300px] p-4 focus:outline-none text-white bg-[#0b0e11] rounded-b-xl ${
          isFocused ? 'ring-2 ring-[#fcd535]/50' : ''
        }`}
        style={{ minHeight: '300px', color: 'white' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

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

    </div>
  );
};

export default RichTextEditor;
