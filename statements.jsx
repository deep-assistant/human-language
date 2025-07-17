// Statement Components for Wikidata Entity Viewer
// This module contains React components for rendering Wikidata statements/claims

// Check if React is available
if (typeof React === 'undefined') {
  console.error('React is not available. Make sure React is loaded before this script.');
}

/**
 * Statement Component
 * Renders individual Wikidata statements with proper formatting and links
 * Receives an array of items: entities (Q), properties (P), and values (V)
 */
function Statement({
  items,
  getLabel,
  onEntityClick,
  onPropertyClick,
  selectedLanguage
}) {
  const quotes = window.getQuotesForLanguage ? window.getQuotesForLanguage(selectedLanguage) : { open: '"', close: '"' };
  const renderItem = (item, index) => {
    if (item.startsWith('Q')) {
      return (
        <a
          key={`item-${index}`}
          href={`entities.html#${item}`}
          className="statement-link"
          onClick={(e) => {
            e.preventDefault();
            if (onEntityClick) {
              onEntityClick(item);
            } else {
              window.location.href = `entities.html#${item}`;
            }
          }}
        >
          {getLabel(item)}
        </a>
      );
    } else if (item.startsWith('P')) {
      return (
        <a
          key={`item-${index}`}
          href={`properties.html#${item}`}
          className="statement-link"
          onClick={(e) => {
            if (onPropertyClick) {
              e.preventDefault();
              onPropertyClick(item);
            }
          }}
        >
          {getLabel(item)}
        </a>
      );
    } else {
      return (
        <React.Fragment key={`item-${index}`}>
          {quotes.open}{item}{quotes.close}
        </React.Fragment>
      );
    }
  };
  return (
    <div
      style={{
        marginBottom: '10px',
        padding: '10px',
        border: '1px solid var(--neon)',
        borderRadius: '4px',
        backgroundColor: 'rgba(0, 255, 0, 0.05)'
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={`wrapper-${index}`}>
          {renderItem(item, index)}
          {index < items.length - 1 && ' '}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Statements List Component
 * Renders a list of all statements for an entity
 */
function StatementsList({
  statements,
  subjectId,
  getLabel,
  onEntityClick,
  onPropertyClick,
  selectedLanguage
}) {
  const statementElements = [];

  console.log('Rendering statements with subjectId:', subjectId);

  for (const [propertyId, claims] of Object.entries(statements)) {
    if (Array.isArray(claims)) {
      claims.forEach((claim, index) => {
        // Create array of items for this statement
        const items = [];

        // Add entity (Q) or property (P)
        items.push(subjectId);

        // Add property (P)
        items.push(propertyId);

        // Add value (V) - could be entity ID or plain text
        if (claim.mainsnak.datavalue) {
          const value = claim.mainsnak.datavalue.value;
          if (claim.mainsnak.datatype === 'wikibase-item' && value.id) {
            items.push(value.id); // Entity ID
          } else if (claim.mainsnak.datatype === 'time') {
            items.push(value.time);
          } else if (claim.mainsnak.datatype === 'quantity') {
            items.push(value.amount);
          } else if (claim.mainsnak.datatype === 'string') {
            items.push(value);
          } else if (claim.mainsnak.datatype === 'url') {
            items.push(value);
          } else if (claim.mainsnak.datatype === 'external-id') {
            items.push(value);
          } else if (claim.mainsnak.datatype === 'commonsMedia') {
            items.push(value);
          } else if (claim.mainsnak.datatype === 'geo-coordinate') {
            items.push(`${value.latitude}, ${value.longitude}`);
          } else if (claim.mainsnak.datatype === 'monolingualtext') {
            items.push(value.text);
          } else if (claim.mainsnak.datatype === 'wikibase-lexeme') {
            items.push(value.id);
          } else if (claim.mainsnak.datatype === 'wikibase-form') {
            items.push(value.id);
          } else if (claim.mainsnak.datatype === 'wikibase-sense') {
            items.push(value.id);
          } else {
            items.push('Unknown value type');
          }
        } else {
          items.push('No value');
        }

        statementElements.push(
          <Statement
            key={`${propertyId}-${index}`}
            items={items}
            getLabel={getLabel}
            onEntityClick={onEntityClick}
            onPropertyClick={onPropertyClick}
            selectedLanguage={selectedLanguage}
          />
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
  subjectId,
  getLabel,
  onEntityClick,
  onPropertyClick,
  selectedLanguage
}) {
  const hasStatements = Object.keys(statements).length > 0;

  if (!hasStatements) {
    return (
      <div>
        <h2>Statements</h2>
        <p>No statements available</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Statements</h2>
      <div style={{ marginTop: '20px' }}>
        <StatementsList
          statements={statements}
          subjectId={subjectId}
          getLabel={getLabel}
          onEntityClick={onEntityClick}
          onPropertyClick={onPropertyClick}
          selectedLanguage={selectedLanguage}
        />
      </div>
    </div>
  );
}

// Export components to global scope
window.StatementComponents = {
  Statement: Statement,
  StatementsList: StatementsList,
  StatementsSection: StatementsSection
}; 