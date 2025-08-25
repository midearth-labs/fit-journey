#!/usr/bin/env tsx

/**
 * Build-time Content Validation Script
 * 
 * This script validates all content files before the application build succeeds.
 * It ensures content integrity, cross-references, and business rules are met.
 * 
 * Usage:
 *   npm run validate:content
 *   npm run build (automatically runs validation)
 */

import { contentManagementSystem } from '../src/data/content/content-management-system';
import { ValidationResult } from '../src/data/content/types';

async function validateContent(): Promise<void> {
  console.log('🚀 Starting content validation...');
  console.log('=====================================');

  try {
    // Initialize the content management system
    await contentManagementSystem.initialize();
    
    // Get validation result
    const validationResult = contentManagementSystem.getValidationResult();
    
    if (!validationResult) {
      throw new Error('No validation result available');
    }

    // Display validation results
    displayValidationResults(validationResult);
    
    // Check if validation passed
    if (!validationResult.isValid) {
      console.error('❌ Content validation failed!');
      console.error('Build process cannot continue until all validation errors are resolved.');
      process.exit(1);
    }

    // Display system health
    displaySystemHealth();
    
    console.log('✅ Content validation completed successfully!');
    console.log('🚀 Build process can continue...');

  } catch (error) {
    console.error('💥 Content validation failed with error:', error);
    console.error('Build process cannot continue.');
    process.exit(1);
  }
}

function displayValidationResults(result: ValidationResult): void {
  console.log('\n📊 Validation Results:');
  console.log('======================');
  
  const { summary, errors, warnings } = result;
  
  // Summary
  console.log(`📈 Total Entities: ${summary.totalEntities}`);
  console.log(`✅ Valid Entities: ${summary.validEntities}`);
  console.log(`❌ Errors: ${summary.errorCount}`);
  console.log(`⚠️  Warnings: ${summary.warningCount}`);
  console.log(`🚨 Critical Errors: ${summary.criticalErrors}`);
  
  // Errors
  if (errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    console.log('=====================');
    
    for (const error of errors) {
      console.error(`  ${error.entityType} ${error.entityId}:`);
      console.error(`    Field: ${error.field}`);
      console.error(`    Message: ${error.message}`);
      console.error(`    Severity: ${error.severity}`);
      console.error('');
    }
  }
  
  // Warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Validation Warnings:');
    console.log('=======================');
    
    for (const warning of warnings) {
      console.warn(`  ${warning.entityType} ${warning.entityId}:`);
      console.warn(`    Field: ${warning.field}`);
      console.warn(`    Message: ${warning.message}`);
      if (warning.suggestion) {
        console.warn(`    Suggestion: ${warning.suggestion}`);
      }
      console.warn('');
    }
  }
  
  // Overall status
  if (result.isValid) {
    console.log('🎉 All content validation checks passed!');
  } else {
    console.log('💥 Content validation failed!');
  }
}

function displaySystemHealth(): void {
  console.log('\n🏥 System Health:');
  console.log('==================');
  
  const health = contentManagementSystem.getSystemHealth();
  
  console.log(`🔧 Initialized: ${health.isInitialized ? '✅ Yes' : '❌ No'}`);
  console.log(`📁 Content Loaded: ${health.contentLoaded ? '✅ Yes' : '❌ No'}`);
  console.log(`✅ Validation Passed: ${health.validationPassed ? '✅ Yes' : '❌ No'}`);
  console.log(`📊 Content Statistics:`);
  
  for (const [type, count] of Object.entries(health.contentStats)) {
    console.log(`  ${type}: ${count} entities`);
  }
  
  console.log(`❌ Validation Errors: ${health.validationErrors}`);
  console.log(`⚠️  Validation Warnings: ${health.validationWarnings}`);
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateContent().catch((error) => {
    console.error('💥 Unhandled error during content validation:', error);
    process.exit(1);
  });
}

export { validateContent };
