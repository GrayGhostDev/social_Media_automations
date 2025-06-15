#!/usr/bin/env node
/**
 * Script to fix video binary handling in workflows
 * Ensures proper binary data propagation between workflows
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '..', 'workflows');

// Patterns to fix in workflows
const fixes = [
  {
    name: 'ContentFactory output',
    file: 'content_factory.json',
    updates: [
      {
        nodeId: '13', // Compile Output node
        path: 'parameters.functionCode',
        find: 'return [{\\n  json: output\\n}];',
        replace: 'return [{\\n  json: output,\\n  binary: videoResult?.binary || {}\\n}];'
      }
    ]
  },
  {
    name: 'ViralHub upload mapping',
    file: 'viral_hub.json',
    updates: [
      {
        nodeId: 'upload', // Platform Upload node
        addParameter: {
          sendBinary: true,
          binaryPropertyName: 'video'
        }
      }
    ]
  },
  {
    name: 'AI Video Veo3 binary output',
    file: 'ai_video_veo3.json',
    updates: [
      {
        nodeId: '24', // Final output node
        path: 'parameters.functionCode',
        ensureIncludes: 'binary: {\\n    video: videoFile\\n  }'
      }
    ]
  }
];

// Function to update workflow JSON
function updateWorkflow(workflowPath, updates) {
  console.log(`📝 Processing: ${path.basename(workflowPath)}`);
  
  try {
    // Read workflow
    const content = fs.readFileSync(workflowPath, 'utf8');
    let workflow = JSON.parse(content);
    let modified = false;
    
    updates.forEach(update => {
      const node = workflow.nodes.find(n => n.id === update.nodeId);
      if (!node) {
        console.log(`  ⚠️  Node ${update.nodeId} not found`);
        return;
      }
      
      // Apply different types of updates
      if (update.path && update.find && update.replace) {
        // String replacement in nested property
        const pathParts = update.path.split('.');
        let target = node;
        for (let i = 0; i < pathParts.length - 1; i++) {
          target = target[pathParts[i]];
        }
        const prop = pathParts[pathParts.length - 1];
        
        if (target[prop] && target[prop].includes(update.find)) {
          target[prop] = target[prop].replace(update.find, update.replace);
          console.log(`  ✅ Updated ${update.nodeId}.${update.path}`);
          modified = true;
        }
      }
      
      if (update.addParameter) {
        // Add parameters to node
        Object.assign(node.parameters, update.addParameter);
        console.log(`  ✅ Added parameters to ${update.nodeId}`);
        modified = true;
      }
      
      if (update.path && update.ensureIncludes) {
        // Ensure string includes certain content
        const pathParts = update.path.split('.');
        let target = node;
        for (let i = 0; i < pathParts.length - 1; i++) {
          target = target[pathParts[i]];
        }
        const prop = pathParts[pathParts.length - 1];
        
        if (target[prop] && !target[prop].includes(update.ensureIncludes)) {
          console.log(`  ⚠️  ${update.nodeId}.${update.path} missing required content`);
          // Log recommendation
          console.log(`     → Ensure it includes: ${update.ensureIncludes}`);
        }
      }
    });
    
    // Save if modified
    if (modified) {
      fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
      console.log(`  💾 Saved changes`);
    } else {
      console.log(`  ℹ️  No changes needed`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }
}

// Main execution
console.log('🔧 Fixing video binary handling in workflows...\n');

fixes.forEach(fix => {
  console.log(`\n${fix.name}:`);
  const workflowPath = path.join(WORKFLOWS_DIR, fix.file);
  
  if (fs.existsSync(workflowPath)) {
    updateWorkflow(workflowPath, fix.updates);
  } else {
    console.log(`  ⚠️  File not found: ${fix.file}`);
  }
});

console.log('\n✅ Video binary handling fixes complete!');
console.log('\n📌 Manual checks needed:');
console.log('1. Ensure Execute Workflow nodes have "Include Binary Data" enabled');
console.log('2. Verify HTTP Request nodes sending video have proper form-data configuration');
console.log('3. Test video upload end-to-end after importing updated workflows');