<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta name="robots" content="noindex, follow"/>
        <title>YourCVPassport — XML Sitemap</title>
        <style>
          :root {
            --bg: #0b0f14;
            --panel: #11161d;
            --border: #1f2937;
            --text: #e5e7eb;
            --muted: #94a3b8;
            --accent: #38bdf8;
            --accent-hover: #7dd3fc;
            --row-alt: #0f141b;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
          }
          .wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
          h1 {
            font-size: 22px;
            margin: 0 0 4px;
            font-weight: 600;
            color: var(--text);
          }
          .sub {
            color: var(--muted);
            margin: 0 0 24px;
            font-size: 13px;
          }
          .stats {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }
          .stat {
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            min-width: 120px;
          }
          .stat-label {
            color: var(--muted);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: var(--accent);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            text-align: left;
            padding: 12px 16px;
            background: #131a23;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--muted);
            border-bottom: 1px solid var(--border);
          }
          td {
            padding: 10px 16px;
            border-bottom: 1px solid var(--border);
            font-size: 13px;
            vertical-align: middle;
          }
          tr:nth-child(even) td { background: var(--row-alt); }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #1a2230; }
          a { color: var(--accent); text-decoration: none; }
          a:hover { color: var(--accent-hover); text-decoration: underline; }
          .num { color: var(--muted); width: 60px; text-align: right; font-variant-numeric: tabular-nums; }
          .date, .freq, .prio { color: var(--muted); white-space: nowrap; }
          .prio { font-variant-numeric: tabular-nums; text-align: right; width: 80px; }
          .freq { width: 100px; }
          .date { width: 110px; }
          @media (max-width: 720px) {
            .wrap { padding: 16px 12px; }
            .freq, .date { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>YourCVPassport — XML Sitemap</h1>
          <p class="sub">This sitemap is generated dynamically. It's intended for search engines but is shown here in a human-readable view.</p>

          <div class="stats">
            <div class="stat">
              <div class="stat-label">Total URLs</div>
              <div class="stat-value"><xsl:value-of select="count(sm:urlset/sm:url)"/></div>
            </div>
            <div class="stat">
              <div class="stat-label">Last generated</div>
              <div class="stat-value" style="font-size:14px;"><xsl:value-of select="sm:urlset/sm:url[1]/sm:lastmod"/></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="num">#</th>
                <th>URL</th>
                <th class="prio">Priority</th>
                <th class="freq">Change freq</th>
                <th class="date">Last mod</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:urlset/sm:url">
                <tr>
                  <td class="num"><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sm:loc}" target="_blank" rel="noopener">
                      <xsl:value-of select="sm:loc"/>
                    </a>
                  </td>
                  <td class="prio"><xsl:value-of select="sm:priority"/></td>
                  <td class="freq"><xsl:value-of select="sm:changefreq"/></td>
                  <td class="date"><xsl:value-of select="sm:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
