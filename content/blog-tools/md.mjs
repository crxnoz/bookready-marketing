// Minimal Markdown for BKRDY blog articles (content/blog/*.md). Enough for an
// article and nothing more, so a draft can never inject markup into the site.
// Everything is escaped first; only these marks become HTML.
//
//   ## / ###        sections (## ids become the outline)
//   paragraphs      blank-line separated
//   - item          bullet list
//   1. item         numbered list
//   > line          pull quote
//   | a | b |       table (header row, then --- separator, then rows)
//   [text](url)     link
//   **bold**  *italic*
//   ![alt](/images/blog/x.webp)   an in-article graphic, on a line of its own
//   :::answer       the short answer block at the top of an article
//   :::copy Label   a block the reader can copy (policy text, reminder scripts)
//   :::             closes either block
//
// A `## Questions` section is special: every `###` under it is a question and
// the paragraphs under it are the answer. build.mjs renders that section as the
// FAQ and emits FAQPage structured data from the same words, so the schema can
// never drift from what the page says.

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Splits "---\nkey: value\n---\nbody" into [meta, body].
export function frontMatter(src) {
  // A leading byte order mark would otherwise make the first `---` unmatchable,
  // and an editor can add one without anyone noticing.
  const m = String(src).replace(/^﻿/, '').replace(/\r\n/g, '\n')
    .match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('post without front matter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 1) continue;
    // A value wrapped in quotes is a writer being careful about a colon, not a
    // value that contains quotes. Keeping them would print them in the title.
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(["'])([\s\S]*)\1$/, '$2');
  }
  return [meta, m[2]];
}

export const slugify = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function inline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
      const external = /^https?:\/\//.test(url) && !/^https?:\/\/(www\.)?bkrdy\.(com|me)/.test(url);
      return `<a href="${url}"${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

// Returns { html, words, headings: [{id, text}], faq: [{q, a:[html]}], minutes }.
export function markdown(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const headings = [];
  const faq = [];
  let para = [], list = null, quote = [], table = null, block = null, inFaq = false, q = null;

  const closeQuestion = () => { if (q && q.a.length) faq.push(q); q = null; };

  const flush = () => {
    if (para.length) { push(`<p>${inline(para.join(' '))}</p>`); para = []; }
    if (list) { push(`<${list.tag}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; }
    if (quote.length) { push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`); quote = []; }
    if (table && table.rows.length) {
      push(`<div class="bq-table__wrap"><table class="bq-table"><thead><tr>${table.head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
        `<tbody>${table.rows.map(r => `<tr>${r.map((c, i) => `<td${i === 0 ? ' scope="row"' : ''}>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      table = null;
    }
  };
  // Inside the Questions section the body goes to the current question instead
  // of the page, so the FAQ markup and its structured data come from one source.
  const push = html => { if (inFaq && q) q.a.push(html); else out.push(html); };

  const cells = line => line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    let m;

    // :::answer / :::copy Label / ::: — verbatim blocks, no inline marks inside
    // a copy block (the reader is meant to paste exactly what they see).
    if ((m = line.match(/^:::(answer|copy)\s*(.*)$/))) {
      flush();
      block = { kind: m[1], label: m[2].trim(), body: [] };
      continue;
    }
    if (block) {
      if (line.trim() === ':::') {
        if (block.kind === 'answer') {
          const paras = block.body.join('\n').split(/\n{2,}/).filter(p => p.trim());
          push(`<aside class="bq-answer"><p class="bq-answer__l">${esc(block.label || 'The short answer')}</p>${paras.map(p => `<p>${inline(p.replace(/\n/g, ' '))}</p>`).join('')}</aside>`);
        } else {
          const text = block.body.join('\n').replace(/^\n+|\n+$/g, '');
          push(`<div class="bq-copy"><div class="bq-copy__h"><p>${esc(block.label || 'Copy this')}</p>` +
            `<button class="bq-copy__b" type="button" data-copy>Copy</button></div><div class="bq-copy__t">${esc(text)}</div></div>`);
        }
        block = null;
      } else block.body.push(line);
      continue;
    }

    if (!line.trim()) { flush(); continue; }

    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      flush();
      const level = Number(m[1].length), text = m[2].trim(), id = slugify(text);
      if (level === 2) {
        closeQuestion();
        inFaq = /^(questions|faq|common questions)$/i.test(text);
        headings.push({ id, text });
        if (inFaq) { out.push(`<h2 id="${id}">${inline(text)}</h2>`); continue; }
        out.push(`<h2 id="${id}">${inline(text)}</h2>`);
        continue;
      }
      if (inFaq) { closeQuestion(); q = { q: text, a: [] }; continue; }
      out.push(`<h3 id="${id}">${inline(text)}</h3>`);
      continue;
    }

    if (/^\|/.test(line)) {
      if (/^\|[\s:|-]+\|?$/.test(line)) continue;            // the --- separator row
      if (para.length || list || quote.length) flush();
      if (!table) table = { head: cells(line), rows: [] };
      else table.rows.push(cells(line));
      continue;
    }

    if ((m = line.match(/^\s*[-*]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      const tag = /^\s*\d/.test(line) ? 'ol' : 'ul';
      if (para.length || quote.length || table || (list && list.tag !== tag)) flush();
      if (!list) list = { tag, items: [] };
      list.items.push(m[1]);
      continue;
    }

    if ((m = line.match(/^!\[([^\]]*)\]\((\/images\/blog\/[a-z0-9-]+\.webp)\)$/))) {
      flush();
      push(`<figure class="bq-fig"><img src="${m[2]}" alt="${esc(m[1])}" loading="lazy" decoding="async" width="1200" height="1500"></figure>`);
      continue;
    }

    if ((m = line.match(/^>\s?(.*)$/))) { if (para.length || list || table) flush(); quote.push(m[1]); continue; }
    if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
    if (list || quote.length || table) flush();
    para.push(line.trim());
  }
  flush();
  closeQuestion();

  // Words a reader actually reads: graphic lines and block fences are not
  // prose, and a link counts as its text rather than its text plus its address.
  const words = String(src || '')
    .replace(/^!\[.*$/gm, '')
    .replace(/^:::.*$/gm, '')
    .replace(/\[([^\]]+)\]\([^)\s]*\)/g, '$1')
    .replace(/[#*>|`~_]/g, ' ')
    .split(/\s+/).filter(Boolean).length;
  return { html: out.join('\n'), words, headings, faq, minutes: Math.max(2, Math.round(words / 225)) };
}

// Plain text of a rendered FAQ answer, for the FAQPage structured data.
export const stripTags = html => String(html).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
