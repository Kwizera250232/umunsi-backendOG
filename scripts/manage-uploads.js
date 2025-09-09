#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class UploadsManager {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.tempDir = path.join(this.uploadsDir, 'temp');
  }

  // Get directory statistics
  getStats() {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      directories: {},
      recentFiles: []
    };

    this.scanDirectory(this.uploadsDir, stats);
    return stats;
  }

  // Scan directory recursively
  scanDirectory(dirPath, stats, relativePath = '') {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      if (item === '.gitkeep' || item === 'README.md') continue;
      
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!stats.directories[relativeItemPath]) {
          stats.directories[relativeItemPath] = { files: 0, size: 0 };
        }
        this.scanDirectory(fullPath, stats, relativeItemPath);
      } else {
        stats.totalFiles++;
        stats.totalSize += stat.size;
        
        if (relativePath) {
          stats.directories[relativePath].files++;
          stats.directories[relativePath].size += stat.size;
        }

        // Add to recent files (last 10)
        stats.recentFiles.push({
          path: relativeItemPath,
          size: stat.size,
          modified: stat.mtime
        });
      }
    }
  }

  // Clean temporary files
  cleanTempFiles() {
    if (!fs.existsSync(this.tempDir)) return;

    const files = fs.readdirSync(this.tempDir);
    let cleanedCount = 0;
    let cleanedSize = 0;

    for (const file of files) {
      if (file === '.gitkeep') continue;
      
      const filePath = path.join(this.tempDir, file);
      const stat = fs.statSync(filePath);
      
      // Remove files older than 24 hours
      const hoursOld = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60);
      if (hoursOld > 24) {
        fs.unlinkSync(filePath);
        cleanedCount++;
        cleanedSize += stat.size;
      }
    }

    return { cleanedCount, cleanedSize };
  }

  // Create missing directories
  ensureDirectories() {
    const requiredDirs = [
      'articles/featured',
      'articles/breaking', 
      'articles/trending',
      'articles/regular',
      'articles/drafts',
      'articles/published',
      'articles/archived',
      'users/avatars',
      'users/profiles',
      'categories',
      'media/videos',
      'media/documents',
      'media/audio',
      'temp'
    ];

    for (const dir of requiredDirs) {
      const fullPath = path.join(this.uploadsDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }
  }

  // Print directory structure
  printStructure() {
    console.log('\n📁 Uploads Directory Structure:\n');
    this.printDirectoryTree(this.uploadsDir, '', true);
  }

  printDirectoryTree(dirPath, prefix, isLast = true) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath).filter(item => 
      item !== '.gitkeep' && item !== 'README.md'
    );
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      const isLastItem = i === items.length - 1;
      
      const connector = isLastItem ? '└── ' : '├── ';
      const nextPrefix = isLastItem ? '    ' : '│   ';
      
      if (stat.isDirectory()) {
        console.log(`${prefix}${connector}📁 ${item}/`);
        this.printDirectoryTree(fullPath, prefix + nextPrefix, false);
      } else {
        const size = this.formatFileSize(stat.size);
        console.log(`${prefix}${connector}📄 ${item} (${size})`);
      }
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Run maintenance tasks
  async runMaintenance() {
    console.log('🧹 Running uploads maintenance...\n');
    
    // Ensure all directories exist
    this.ensureDirectories();
    
    // Clean temp files
    const tempCleanup = this.cleanTempFiles();
    if (tempCleanup.cleanedCount > 0) {
      console.log(`🗑️  Cleaned ${tempCleanup.cleanedCount} temporary files (${this.formatFileSize(tempCleanup.cleanedSize)})`);
    }
    
    // Get and display stats
    const stats = this.getStats();
    console.log(`\n📊 Uploads Statistics:`);
    console.log(`   Total Files: ${stats.totalFiles}`);
    console.log(`   Total Size: ${this.formatFileSize(stats.totalSize)}`);
    
    console.log('\n📁 Directory Breakdown:');
    for (const [dir, info] of Object.entries(stats.directories)) {
      if (info.files > 0) {
        console.log(`   ${dir}: ${info.files} files (${this.formatFileSize(info.size)})`);
      }
    }
    
    console.log('\n✨ Maintenance complete!');
  }
}

// CLI interface
if (require.main === module) {
  const manager = new UploadsManager();
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      const stats = manager.getStats();
      console.log('📊 Uploads Statistics:', JSON.stringify(stats, null, 2));
      break;
      
    case 'clean':
      const cleanup = manager.cleanTempFiles();
      console.log(`🗑️  Cleaned ${cleanup.cleanedCount} files (${manager.formatFileSize(cleanup.cleanedSize)})`);
      break;
      
    case 'structure':
      manager.printStructure();
      break;
      
    case 'maintenance':
      manager.runMaintenance();
      break;
      
    default:
      console.log('📁 Umunsi Uploads Manager\n');
      console.log('Usage: node manage-uploads.js [command]\n');
      console.log('Commands:');
      console.log('  stats      - Show uploads statistics');
      console.log('  clean      - Clean temporary files');
      console.log('  structure  - Show directory structure');
      console.log('  maintenance - Run full maintenance');
      break;
  }
}

module.exports = UploadsManager;
