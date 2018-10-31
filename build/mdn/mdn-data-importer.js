/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

const { propertyDescriptions } = require('./mdn-documentation')

const mdnExcludedProperties = [
  '--*', // custom properties
  'block-overflow', // dropped in favor of `overflow-block`
  // dropped in favor of `offset`
  'motion',
  'motion-offset',
  'motion-path',
  'motion-rotation'
]

function addMDNProperties(vscProperties) {
  const propertyMap = {}

  const mdnProperties = require('mdn-data').css.properties
  const mdnAtRules = require('mdn-data').css.atRules

  // Flatten at-rule properties and put all properties together
  const allMDNProperties = mdnProperties
  for (const atRuleName of Object.keys(mdnAtRules)) {
    if (mdnAtRules[atRuleName].descriptors) {
      for (const atRulePropertyName of Object.keys(mdnAtRules[atRuleName].descriptors)) {
        allMDNProperties[atRulePropertyName] = mdnAtRules[atRuleName].descriptors[atRulePropertyName]
      }
    }
  }

  mdnExcludedProperties.forEach(p => {
    delete allMDNProperties[p]
  })

  /**
   * 1. Go through VSC properties. For each entry that has a matching entry in MDN, merge both entry.
   */
  vscProperties.forEach(p => {
    if (p.name) {
      if (allMDNProperties[p.name]) {
        propertyMap[p.name] = {
          ...p,
          ...extractMDNProperties(allMDNProperties[p.name])
        }
      } else {
        propertyMap[p.name] = p
      }
    }
  })

  /**
   * 2. Go through MDN properties. For each entry that hasn't been recorded, add it with empty description.
   */
  for (const pn of Object.keys(allMDNProperties)) {
    if (!propertyMap[pn]) {
      propertyMap[pn] = {
        name: pn,
        desc: propertyDescriptions[pn] ? propertyDescriptions[pn] : '',
        restriction: 'none',
        ...extractMDNProperties(allMDNProperties[pn])
      }
    }
  }

  return Object.values(propertyMap)
}

/**
 * Extract only the MDN data that we use
 */
function extractMDNProperties(mdnEntry) {
  if (mdnEntry.status === 'standard') {
    return {
      syntax: mdnEntry.syntax,
      mdn_url: mdnEntry.mdn_url
    }
  }

  return {
    status: abbreviateStatus(mdnEntry.status),
    syntax: mdnEntry.syntax,
    mdn_url: mdnEntry.mdn_url
  }
}

/**
 * Make syntax as small as possible for browser usage
 */
function abbreviateStatus(status) {
  return {
    nonstandard: 'n',
    experimental: 'e',
    obsolete: 'o'
  }[status]
}

module.exports = {
  abbreviateStatus,
  addMDNProperties
}
