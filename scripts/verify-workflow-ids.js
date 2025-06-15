#!/usr/bin/env node
/**
 * Script to verify and fix workflow ID references
 * Ensures all Execute Workflow nodes reference correct sub-workflow IDs
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '..', 'workflows');

// Expected workflow mappings
const WORKFLOW_MAPPINGS = {
  'ViralHub': {
    file: 'viral_hub.json',
    references: {
      'ResearchFetcher': { nodeIds: ['execResearch'] },
      'ContentFactory': { nodeIds: ['execContent'] },
      'ContentQCSuite': { nodeIds: ['execQC'] },
      'PublisherFormatter': { nodeIds: ['execFormat'] },
      'AnalyticsLoop': { nodeIds: ['execAnalytics'] }
    }
  },
  'ContentFactory': {
    file: 'content_factory.json',
    references: {
      'AIVideoVeo3': { nodeIds: ['12'] }
    }
  }
};

// Load all workflow files
function loadWorkflows() {
  const workflows = {};
  const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf8');
      const workflow = JSON.parse(content);
      workflows[workflow.id || workflow.name] = {
        file,
        content: workflow
      };
    } catch (error) {
      console.error(`Error loading ${file}: ${error.message}`);
    }
  });
  
  return workflows;
}

// Verify workflow references
function verifyReferences(workflows) {
  console.log('🔍 Verifying workflow ID references...\n');
  
  let hasErrors = false;
  
  Object.entries(WORKFLOW_MAPPINGS).forEach(([workflowName, config]) => {
    console.log(`📋 ${workflowName}:`);
    
    const workflow = workflows[workflowName];
    if (!workflow) {
      console.log(`  ❌ Workflow not found!`);
      hasErrors = true;
      return;
    }
    
    // Check each reference
    Object.entries(config.references).forEach(([targetWorkflow, refConfig]) => {
      const targetExists = workflows[targetWorkflow];
      
      refConfig.nodeIds.forEach(nodeId => {
        const node = workflow.content.nodes.find(n => n.id === nodeId);
        
        if (!node) {
          console.log(`  ❌ Node ${nodeId} not found`);
          hasErrors = true;
        } else if (node.type !== 'n8n-nodes-base.executeWorkflow') {
          console.log(`  ⚠️  Node ${nodeId} is not an Execute Workflow node`);
        } else {
          const referencedId = node.parameters.workflowId;
          
          if (!targetExists) {
            console.log(`  ❌ Referenced workflow "${targetWorkflow}" does not exist`);
            hasErrors = true;
          } else if (referencedId !== targetWorkflow) {
            console.log(`  ⚠️  Node ${nodeId} references "${referencedId}" but should reference "${targetWorkflow}"`);
            hasErrors = true;
          } else {
            console.log(`  ✅ Node ${nodeId} → ${targetWorkflow}`);
          }
        }
      });
    });
  });
  
  return !hasErrors;
}

// Check for duplicate workflow IDs
function checkDuplicateIds(workflows) {
  console.log('\n🔍 Checking for duplicate workflow IDs...\n');
  
  const idMap = {};
  let hasDuplicates = false;
  
  Object.entries(workflows).forEach(([id, workflow]) => {
    if (idMap[id]) {
      console.log(`  ❌ Duplicate ID "${id}" found in:`);
      console.log(`     - ${idMap[id]}`);
      console.log(`     - ${workflow.file}`);
      hasDuplicates = true;
    } else {
      idMap[id] = workflow.file;
    }
  });
  
  if (!hasDuplicates) {
    console.log('  ✅ No duplicate IDs found');
  }
  
  return !hasDuplicates;
}

// Generate workflow import order
function generateImportOrder() {
  console.log('\n📦 Recommended workflow import order:\n');
  
  const order = [
    'prompt_hub_loader.json     (utility workflow)',
    'ai_video_veo3.json         (video generation sub-workflow)',
    'research_fetcher.json      (research sub-workflow)',
    'content_factory.json       (content generation sub-workflow)',
    'content_qc_suite.json      (quality control sub-workflow)',
    'publisher_formatter.json   (publishing sub-workflow)',
    'analytics_loop.json        (analytics sub-workflow)',
    'viral_hub.json             (main orchestrator - import last!)'
  ];
  
  order.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item}`);
  });
}

// Generate ID mapping file for reference
function generateIdMapping(workflows) {
  const mapping = {};
  
  Object.entries(workflows).forEach(([id, workflow]) => {
    mapping[id] = {
      file: workflow.file,
      name: workflow.content.name,
      type: workflow.content.tags?.includes('orchestrator') ? 'orchestrator' :
            workflow.content.tags?.includes('subworkflow') ? 'subworkflow' : 'utility'
    };
  });
  
  const mappingPath = path.join(WORKFLOWS_DIR, 'workflow-id-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`\n💾 Saved workflow ID mapping to: workflow-id-mapping.json`);
}

// Main execution
console.log('🔧 Verifying workflow ID references...\n');

const workflows = loadWorkflows();
console.log(`📚 Loaded ${Object.keys(workflows).length} workflows\n`);

const referencesValid = verifyReferences(workflows);
const noDuplicates = checkDuplicateIds(workflows);

if (referencesValid && noDuplicates) {
  console.log('\n✅ All workflow references are valid!');
} else {
  console.log('\n❌ Issues found! Please fix the errors above.');
}

generateImportOrder();
generateIdMapping(workflows);

console.log('\n💡 Tips:');
console.log('- Import workflows in the recommended order');
console.log('- Run PromptHubLoader manually after importing');
console.log('- Activate ViralHub last after all sub-workflows are imported');
console.log('- Use workflow-id-mapping.json as reference');