// Statement Components for Wikidata Entity Viewer
// This module contains React components for rendering Wikidata statements/claims

(function() {
  'use strict';

  // Check if React is available
  if (typeof React === 'undefined') {
    console.error('React is not available. Make sure React is loaded before this script.');
    return;
  }

  /**
   * Statement Component
   * Renders individual Wikidata statements with proper formatting and links
   */
  function Statement({ 
    claim, 
    propertyId, 
    entityId, 
    currentEntityLabel, 
    propertyLabel, 
    getEntityLabel,
    onEntityClick,
    onPropertyClick 
  }) {
    const formatFactValue = (claim, getEntityLabel) => {
      if (claim.mainsnak.datavalue) {
        const value = claim.mainsnak.datavalue.value;
        if (claim.mainsnak.datatype === 'wikibase-item') {
          return getEntityLabel(value.id);
        } else if (claim.mainsnak.datatype === 'time') {
          return value.time;
        } else if (claim.mainsnak.datatype === 'quantity') {
          return value.amount;
        } else if (claim.mainsnak.datatype === 'string') {
          return value;
        } else if (claim.mainsnak.datatype === 'url') {
          return value;
        } else if (claim.mainsnak.datatype === 'external-id') {
          return value;
        } else if (claim.mainsnak.datatype === 'commonsMedia') {
          return value;
        } else if (claim.mainsnak.datatype === 'geo-coordinate') {
          return `${value.latitude}, ${value.longitude}`;
        } else if (claim.mainsnak.datatype === 'monolingualtext') {
          return value.text;
        } else if (claim.mainsnak.datatype === 'wikibase-lexeme') {
          return value.id;
        } else if (claim.mainsnak.datatype === 'wikibase-form') {
          return value.id;
        } else if (claim.mainsnak.datatype === 'wikibase-sense') {
          return value.id;
        }
      }
      return 'Unknown value type';
    };

    const value = formatFactValue(claim, getEntityLabel);
    
    // Create clickable links for entities
    const entityLink = React.createElement('a', {
      href: `#${entityId}`,
      className: 'statement-link',
      onClick: (e) => {
        e.preventDefault();
        if (onEntityClick) {
          onEntityClick(entityId);
        } else {
          window.location.hash = entityId;
        }
      }
    }, currentEntityLabel);
    
    const propertyLink = React.createElement('a', {
      href: `properties.html#${propertyId}`,
      className: 'statement-link',
      onClick: (e) => {
        if (onPropertyClick) {
          e.preventDefault();
          onPropertyClick(propertyId);
        }
      }
    }, propertyLabel);
    
    // Create value link if it's an entity
    let valueElement = value;
    if (claim.mainsnak.datatype === 'wikibase-item' && claim.mainsnak.datavalue?.value?.id) {
      const valueEntityId = claim.mainsnak.datavalue.value.id;
      valueElement = React.createElement('a', {
        href: `#${valueEntityId}`,
        className: 'statement-link',
        onClick: (e) => {
          e.preventDefault();
          if (onEntityClick) {
            onEntityClick(valueEntityId);
          } else {
            window.location.hash = valueEntityId;
          }
        }
      }, value);
    }
    
    return React.createElement('div', {
      style: { 
        marginBottom: '10px', 
        padding: '10px', 
        border: '1px solid var(--neon)', 
        borderRadius: '4px',
        backgroundColor: 'rgba(0, 255, 0, 0.05)'
      }
    }, entityLink, ' ', propertyLink, ' ', valueElement);
  }

  /**
   * Statements List Component
   * Renders a list of all statements for an entity
   */
  function StatementsList({ 
    statements, 
    entityId, 
    currentEntityLabel, 
    getPropertyLabel, 
    getEntityLabel,
    onEntityClick,
    onPropertyClick 
  }) {
    const statementElements = [];
    
    console.log('Rendering statements with entityId:', entityId);
    console.log('Rendering statements with currentEntityLabel:', currentEntityLabel);
    
    for (const [propertyId, claims] of Object.entries(statements)) {
      if (Array.isArray(claims)) {
        claims.forEach((claim, index) => {
          const propertyLabel = getPropertyLabel(propertyId);
          
          statementElements.push(
            React.createElement(Statement, {
              key: `${propertyId}-${index}`,
              claim: claim,
              propertyId: propertyId,
              entityId: entityId,
              currentEntityLabel: currentEntityLabel,
              propertyLabel: propertyLabel,
              getEntityLabel: getEntityLabel,
              onEntityClick: onEntityClick,
              onPropertyClick: onPropertyClick
            })
          );
        });
      }
    }
    
    return statementElements;
  }

  /**
   * Statements Section Component
   * Renders the complete statements section with title and conditional rendering
   */
  function StatementsSection({ 
    statements, 
    entityId, 
    currentEntityLabel, 
    getPropertyLabel, 
    getEntityLabel,
    onEntityClick,
    onPropertyClick 
  }) {
    const hasStatements = Object.keys(statements).length > 0;
    
    if (!hasStatements) {
      return React.createElement('div', null,
        React.createElement('h2', null, 'Statements'),
        React.createElement('p', null, 'No statements available')
      );
    }
    
    return React.createElement('div', null,
      React.createElement('h2', null, 'Statements'),
      React.createElement('div', { style: { marginTop: '20px' } },
        React.createElement(StatementsList, {
          statements: statements,
          entityId: entityId,
          currentEntityLabel: currentEntityLabel,
          getPropertyLabel: getPropertyLabel,
          getEntityLabel: getEntityLabel,
          onEntityClick: onEntityClick,
          onPropertyClick: onPropertyClick
        })
      )
    );
  }

  // Export components to global scope
  window.StatementComponents = {
    Statement: Statement,
    StatementsList: StatementsList,
    StatementsSection: StatementsSection
  };

})(); 