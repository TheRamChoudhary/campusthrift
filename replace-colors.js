const fs = require("fs");
const path = require("path");

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath, stats);
    }
  });
}

const targetDir = path.join(__dirname, "client", "src");

walkSync(targetDir, (filepath) => {
  if (filepath.endsWith(".jsx") || filepath.endsWith(".js") || filepath.endsWith(".css")) {
    let content = fs.readFileSync(filepath, "utf8");
    let original = content;

    // Remove text shadow from index.css
    if (filepath.endsWith("index.css")) {
      content = content.replace(/text-shadow:[^;]+;/g, "");
    }

    // Replace background overlay
    content = content.replace(/bg-\[\#121212\]\/15 backdrop-blur-md/g, "bg-black/60 backdrop-blur-2xl");

    // Replace card glass (handling multiple variants)
    // Sometimes it's `bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d]`
    // Sometimes it's `bg-[#181818] border border-[#333333]` (Home.jsx)
    content = content.replace(/bg-\[\#161b22\]\/5 backdrop-blur-lg border border-\[\#30363d\]/g, "bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20");
    content = content.replace(/bg-\[\#181818\] border border-\[\#333333\]/g, "bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20");
    
    // Some instances have `bg-[#161b22]/85` (ListingCard)
    content = content.replace(/bg-\[\#161b22\]\/85 border border-\[\#30363d\]/g, "bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20");
    
    // Navbar
    content = content.replace(/bg-\[\#121212\]\/80 backdrop-blur-2xl border-b border-\[\#333333\]/g, "bg-black/50 backdrop-blur-2xl border-b border-white/10");
    content = content.replace(/bg-\[\#181818\]\/95 backdrop-blur-lg border border-\[\#333333\]/g, "bg-black/80 backdrop-blur-2xl border border-white/10");
    
    // Mobile Drawer
    content = content.replace(/bg-\[\#121212\]\/95 border-b border-\[\#333333\]/g, "bg-black/80 backdrop-blur-2xl border-b border-white/10");

    if (content !== original) {
      fs.writeFileSync(filepath, content, "utf8");
      console.log("Updated: " + filepath);
    }
  }
});
