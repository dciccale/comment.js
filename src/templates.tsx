import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { DocumentationData, JsonItem, ParamItem, ReturnItem, SectionData, SectionLine, TocItem } from './types.js';

function Raw({ html }: { html: string }): React.ReactElement {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function SectionHeading({ sectionData }: { sectionData: SectionData }): React.ReactElement {
  const Tag = `h${sectionData.level}` as React.ElementType;
  return (
    <Tag
      className={`cjs-title${sectionData.type ? ` cjs-${sectionData.type}` : ''}`}
      id={sectionData.name}
    >
      <Raw html={`${sectionData.name}${sectionData.brackets || ''}`} />
      <a href={`#${sectionData.name}`} title="Link to this section" className="cjs-hash">#</a>
      <span className="cjs-sourceline">
        Defined in:{' '}
        <a title={`Go to line ${sectionData.line} in the source`} href={`${sectionData.srclink}-src.html#L${sectionData.line}`}>
          {sectionData.filename}:{sectionData.line}
        </a>
      </span>
    </Tag>
  );
}

function Params({ params }: { params: ParamItem[] }): React.ReactElement {
  return (
    <dl className="cjs-arguments">
      {params.map((param, index) => (
        <React.Fragment key={`${param.name}-${index}`}>
          <dt className="cjs-param">{param.name}</dt>
          <dd className="cjs-type">
            {param.types.map((type) => <em className={`cjs-type-${type}`} key={type}>{type}</em>)}
            {param.optional ? <em className="cjs-param-optional">optional</em> : null}
          </dd>
          <dd className="cjs-param-desc"><Raw html={param.desc} /></dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function renderJsonItems(json: Array<JsonItem | string>, cursor = { index: 0 }): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  while (cursor.index < json.length) {
    const item = json[cursor.index];
    const index = cursor.index;
    cursor.index += 1;

    if (typeof item === 'string') {
      nodes.push(<li key={index}>{item}</li>);
      continue;
    }

    if (item.end) {
      nodes.push(<li key={index}>{item.end}</li>);
      break;
    }

    if (item.start) {
      nodes.push(
        <li key={index}>
          {item.start}
          <ul className="cjs-json">{renderJsonItems(json, cursor)}</ul>
        </li>,
      );
      continue;
    }

    if (item.key) {
      nodes.push(
        <li key={index}>
          <span className="cjs-json-key">{item.key}</span>
          <span className="cjs-type">
            {(item.types || []).map((type) => <em className={`cjs-type-${type}`} key={type}>{type}</em>)}
            {item.optional ? <em className="cjs-param-optional">optional</em> : null}
          </span>
          <span className="cjs-param-desc"><Raw html={item.desc || ''} /></span>
        </li>,
      );
      continue;
    }

    nodes.push(<li key={index} />);
  }

  return nodes;
}

function JsonList({ json }: { json: Array<JsonItem | string> }): React.ReactElement {
  return (
    <ul className="cjs-json">
      {renderJsonItems(json)}
    </ul>
  );
}

function Returns({ returns }: { returns: ReturnItem }): React.ReactElement {
  return (
    <p className="cjs-return">
      <strong className="cjs-header">Returns</strong>
      {(returns.types || []).map((type) => <em className={`cjs-type-${type}`} key={type}>{type}</em>)}
      <span className="cjs-param-desc"><Raw html={Array.isArray(returns.desc) ? returns.desc.join('') : returns.desc} /></span>
    </p>
  );
}

function SectionLineView({ line }: { line: SectionLine }): React.ReactElement | null {
  if ('text' in line) return <p className="cjs-text"><Raw html={line.text} /></p>;
  if ('params' in line) return <Params params={line.params as ParamItem[]} />;
  if ('html' in line) return <div dangerouslySetInnerHTML={{ __html: line.html }} />;
  if ('head' in line) return <p className="cjs-header"><Raw html={line.head} /></p>;
  if ('code' in line) return <pre className="prettyprint linenums cjs-pre"><code className="cjs-code">{line.code.join('\n')}</code></pre>;
  if ('json' in line) return <JsonList json={line.json} />;
  if ('return' in line) return <Returns returns={line.return} />;
  return null;
}

function Toc({ toc }: { toc: TocItem[] }): React.ReactElement {
  return (
    <ul id="cjs-toc" className="cjs-panel">
      {toc.map((item) => (
        <li key={item.name} className={`cjs-lvl-${item.indent}${item.type ? ` cjs-${item.type}` : ''}`}>
          <a href={`#${item.name}`}>{item.name}{item.brackets}</a>
        </li>
      ))}
    </ul>
  );
}

function DocumentationPage({ data }: { data: DocumentationData }): React.ReactElement {
  const title = data.title || 'API Documentation';
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="css/docs.css" />
      </head>
      <body>
        <div id="header">
          <a href={data.homepage || ''}>
            <img src={data.logo || 'img/logo.png'} alt={title} />
          </a>
          <button id="cjs-theme-toggle" type="button" aria-label="Toggle color theme" aria-pressed="false">Dark</button>
        </div>
        <div id="cjs-documentation" className="cjs-panel">
          <h1>{title}</h1>
          {data.sections.map((section) => {
            const sectionData = section[0] as SectionData;
            return (
              <div className={`cjs-section ${sectionData.title}-section`} key={sectionData.name}>
                <SectionHeading sectionData={sectionData} />
                {section.slice(1).map((line, index) => <SectionLineView line={line} key={index} />)}
              </div>
            );
          })}
        </div>
        <div id="cjs-nav">
          <div className="cjs-nav-header">
            <form>
              <input type="text" id="cjs-filter" />
              <span role="button" id="cjs-search-reset">x</span>
            </form>
          </div>
          <Toc toc={data.toc} />
        </div>
        <script src="js/prettify.js" />
        <script src="js/toc-filter.js" />
        {(data.scripts || []).map((src) => <script src={src} key={src} />)}
        {data.trackingID ? <script dangerouslySetInnerHTML={{ __html: `window.ga&&ga('create','${data.trackingID}');` }} /> : null}
      </body>
    </html>
  );
}

function SourcePage({ filename, src }: { filename: string; src: string }): React.ReactElement {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{`Source code of ${filename}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="css/docs.css" />
      </head>
      <body id="cjs-src">
        <button id="cjs-theme-toggle" type="button" aria-label="Toggle color theme" aria-pressed="false">Dark</button>
        <pre className="prettyprint linenums cjs-pre"><code className="cjs-code">{src}</code></pre>
        <script src="js/prettify.js" />
        <script src="js/src.js" />
      </body>
    </html>
  );
}

export function renderDocumentation(data: DocumentationData): string {
  return `<!doctype html>${renderToStaticMarkup(<DocumentationPage data={data} />)}`;
}

export function renderSource(filename: string, src: string): string {
  return `<!doctype html>${renderToStaticMarkup(<SourcePage filename={filename} src={src} />)}`;
}
