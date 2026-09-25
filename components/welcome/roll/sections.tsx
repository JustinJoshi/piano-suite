"use client";

import Link from "next/link";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { RollInline } from "@/components/roll/inline";
import { RollPassageView } from "@/components/roll/roll-passage";
import { RollSectionHead } from "@/components/roll/section-head";

/** Learning a piece: the loop printed four times, a little shorter (faster) each pass. */
export function RollPiece() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.piece;
  return (
    <section className="roll-section" id="piece" aria-labelledby="piece-title">
      <RollSectionHead copy={copy} titleId="piece-title">
        <p className="roll-lede roll-aside">{copy.aside}</p>
        <p className="roll-go">
          <Link className="roll-link roll-link-arrow" href="/tools/workshop">
            {copy.go}
          </Link>
        </p>
      </RollSectionHead>
      <div className="roll-row roll-loop" aria-hidden="true">
        <div />
        <RollPassageView id="loop" />
      </div>
    </section>
  );
}

/** A shelf of roll boxes with an empty space labelled "yours". */
function Shelf() {
  const box = (x: number, y: number, h: number, alt = false, lean = false) => (
    <g className={alt ? "roll-box roll-box-alt" : "roll-box"} transform={`translate(${x} ${y})${lean ? " rotate(-9 23 150)" : ""}`}>
      <rect width={46} height={h} rx={3} />
      <rect className="roll-box-lid" width={46} height={20} rx={3} />
      <rect className="roll-box-label" x={7} y={h * 0.33} width={32} height={46} rx={1.5} />
      <path className="roll-box-lines" d={`M12 ${h * 0.33 + 12}h22M12 ${h * 0.33 + 20}h16M12 ${h * 0.33 + 28}h20`} />
      <g className="roll-box-perf">
        <rect x={10} y={h - 30} width={3} height={8} rx={1} />
        <rect x={18} y={h - 34} width={3} height={12} rx={1} />
        <rect x={26} y={h - 28} width={3} height={6} rx={1} />
        <rect x={33} y={h - 32} width={3} height={10} rx={1} />
      </g>
    </g>
  );
  return (
    <svg className="roll-shelf" viewBox="0 0 440 250" role="group" aria-label="A shelf of practice pages, with an empty space for yours" data-roll-reveal="">
      <g aria-hidden="true">
        {box(28, 58, 162)}
        {box(80, 44, 176, true)}
        {box(132, 66, 154)}
        {box(186, 70, 150, false, true)}
        {box(356, 50, 170, true)}
      </g>
      <Link className="roll-shelf-slot" href="/sign-up" aria-label="Publish your own page. Signing up is free.">
        <rect className="roll-slot-hit" x={246} y={30} width={96} height={192} />
        <rect className="roll-slot-outline" x={262} y={62} width={50} height={158} rx={3} />
        <g className="roll-slot-ghost">
          <rect x={262} y={62} width={50} height={158} rx={3} />
          <rect className="roll-box-lid" x={262} y={62} width={50} height={20} rx={3} />
          <rect className="roll-box-label" x={270} y={108} width={34} height={46} rx={1.5} />
        </g>
        <path className="roll-slot-string" d="M287 62 C 287 48, 300 42, 312 40" />
        <g className="roll-slot-tag" transform="translate(304 24) rotate(8)">
          <rect width={58} height={26} rx={3} />
          <circle cx={8} cy={13} r={2.4} />
          <text x={34} y={18} textAnchor="middle">
            yours
          </text>
        </g>
      </Link>
      <g aria-hidden="true">
        <path className="roll-plank" d="M8 221h424" />
        <path className="roll-plank-edge" d="M8 229h424" />
        <path className="roll-plank" d="M40 229v14M400 229v14" />
      </g>
    </svg>
  );
}

export function RollShelf() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.shelf;
  return (
    <section className="roll-section" id="shelf" aria-labelledby="shelf-title">
      <div className="roll-row">
        <div className="roll-margin" data-roll-reveal="">
          <p className="roll-label">{copy.label}</p>
          <p className="roll-note">{copy.note}</p>
        </div>
        <div className="roll-shelf-grid">
          <div className="roll-prose" data-roll-reveal="">
            <h2 id="shelf-title" className="roll-h2">
              {copy.title}
            </h2>
            <p className="roll-lede">{copy.lede}</p>
            <p>{copy.body}</p>
            <p className="roll-shelf-links">
              <Link className="roll-link roll-link-arrow" href="/marketplace">
                {copy.browse}
              </Link>
              <Link className="roll-link" href="/sign-up">
                {copy.publish}
              </Link>
            </p>
          </div>
          <Shelf />
        </div>
      </div>
    </section>
  );
}

const NUMERALS = ["i", "ii", "iii", "iv", "v", "vi"];

export function RollReading() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.reading;
  return (
    <section className="roll-section" id="reading" aria-labelledby="reading-title">
      <RollSectionHead copy={copy} titleId="reading-title" />
      <div className="roll-row">
        <div />
        <div>
          <ol className="roll-articles">
            {copy.items.map((item, i) => (
              <li key={item.slug} className="roll-article" data-roll-reveal="">
                <span className="roll-article-no" aria-hidden="true">
                  {NUMERALS[i] ?? i + 1}
                </span>
                <h3 className="roll-article-title">
                  <Link href={`/articles/${item.slug}`}>{item.title}</Link>
                </h3>
                <p>{item.summary}</p>
              </li>
            ))}
          </ol>
          <p className="roll-go" data-roll-reveal="">
            <Link className="roll-link roll-link-arrow" href="/articles">
              {copy.go}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export function RollCost() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.cost;
  return (
    <section className="roll-section" id="cost" aria-labelledby="cost-title">
      <RollSectionHead copy={copy} titleId="cost-title" />
      <div className="roll-row">
        <div />
        <dl className="roll-tariff">
          {copy.rows.map((row, i) => {
            const last = i === copy.rows.length - 1;
            return (
              <div key={row.who} className="roll-tariff-row" data-later={last ? "" : undefined} data-roll-reveal="">
                <dt>
                  <span>{row.who}</span>
                  <span className="roll-tariff-dots" aria-hidden="true" />
                  <span className="roll-tariff-price">{row.price}</span>
                </dt>
                <dd>
                  <RollInline text={row.body} />
                </dd>
                {last ? (
                  <span className="roll-stamp" aria-hidden="true">
                    {copy.stamp}
                  </span>
                ) : null}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
