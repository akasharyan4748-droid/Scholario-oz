'use client'

/**
 * portfolio/portfolio-html — the STUDENT PORTFOLIO print document.
 *
 * The Portfolio tab's REAL export (the fees module's statement-html.ts +
 * download-file.ts pattern): an institutional-quality, print-clean
 * document opened in a print window — serif body, school letterhead,
 * restrained violet document accents — never a screenshot of the webpage.
 *
 * Every fact arrives from the canonical growth store (items +
 * achievements + skillsWithEvidence) and the roster's student record;
 * this builder NEVER invents a date, a number or an endorsement. Class
 * context (student · class) appears exactly once, here, where a formal
 * document needs it.
 */

import { school } from '@/lib/mock/school'
import type { GrowthAchievement, PortfolioItem, PortfolioKind, SkillSummary } from '@/lib/store/student-growth-store'

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function fullDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${Number(m[3])} ${MONTHS_FULL[Number(m[2]) - 1]} ${m[1]}`
}

/** Document labels for the portfolio kinds — plural for group headings. */
const KIND_DOC_LABEL: Record<PortfolioKind, string> = {
  project: 'Projects',
  certificate: 'Certificates',
  achievement: 'Achievements',
  activity: 'Activities',
  artwork: 'Artwork',
  presentation: 'Presentations',
}

/** Singular kind labels for evidence rows. */
const KIND_DOC_SINGULAR: Record<PortfolioKind, string> = {
  project: 'project',
  certificate: 'certificate',
  achievement: 'achievement',
  activity: 'activity',
  artwork: 'artwork',
  presentation: 'presentation',
}

const KIND_ORDER: PortfolioKind[] = ['project', 'certificate', 'achievement', 'activity', 'artwork', 'presentation']

export interface PortfolioDocInput {
  student: {
    name: string
    classSection: string
    admissionNo?: string
    rollNo?: string
  }
  items: PortfolioItem[]
  achievements: GrowthAchievement[]
  skills: SkillSummary[]
  /** Compile date (yyyy-mm-dd). */
  asOn: string
}

/** One portfolio entry, print-voiced. */
function itemBlock(item: PortfolioItem, achievements: GrowthAchievement[]): string {
  const linked = item.achievementId
    ? achievements.find((a) => a.id === item.achievementId) ?? null
    : null
  const metaBits: string[] = [fullDate(item.dateISO)]
  if (item.subject) metaBits.push(esc(item.subject))
  const context = linked
    ? `<div class="item-note">Recognised achievement — <strong>${esc(linked.title)}</strong></div>`
    : `<div class="item-note muted">Added by student</div>`
  const skills = item.skills.length > 0
    ? `<div class="item-skills"><span class="lbl">Skills</span> ${item.skills.map(esc).join(' · ')}</div>`
    : ''
  return `<div class="item">
    <div class="item-head"><strong>${esc(item.title)}</strong><span class="item-meta">${metaBits.join(' · ')}</span></div>
    ${context}
    <div class="item-desc">${esc(item.description)}</div>
    ${skills}
  </div>`
}

/** Build the student portfolio document (pure HTML string). */
export function buildPortfolioHTML(input: PortfolioDocInput): string {
  const byDateDesc = (a: PortfolioItem, b: PortfolioItem) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0)

  const featured = input.items.filter((i) => i.featured).sort(byDateDesc)
  const featuredSection = featured.length > 0
    ? `<h2>Featured work</h2>
       ${featured.map((i) => itemBlock(i, input.achievements)).join('')}`
    : ''

  const groups = KIND_ORDER
    .map((kind) => ({
      kind,
      items: input.items.filter((i) => i.kind === kind).sort(byDateDesc),
    }))
    .filter((g) => g.items.length > 0)

  const groupsSection = groups
    .map((g) => `<h2>${KIND_DOC_LABEL[g.kind]}</h2>${g.items.map((i) => itemBlock(i, input.achievements)).join('')}`)
    .join('')

  const skillsSection = input.skills.length > 0
    ? `<h2>Skills with evidence</h2>
       <table class="data">
        <thead><tr><th style="width:34%">Skill</th><th>Evidence — real work carrying this skill</th></tr></thead>
        <tbody>
          ${input.skills
            .map(
              (s) => `<tr>
                <td><strong>${esc(s.skill)}</strong><div class="muted small">${s.evidence.length} ${s.evidence.length === 1 ? 'piece' : 'pieces'} of work</div></td>
                <td>${s.evidence
                  .map((ev) => `<div class="ev">${esc(ev.title)}<span class="muted"> · ${fullDate(ev.dateISO)} · ${ev.kind === 'achievement' ? 'achievement' : KIND_DOC_SINGULAR[ev.kind as PortfolioKind] ?? esc(ev.kind)}</span></div>`)
                  .join('')}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
       </table>`
    : ''

  const compiledOn = fullDate(input.asOn)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Student Portfolio — ${esc(input.student.name)} — ${esc(school.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; margin: 36px auto; max-width: 780px; color: #1f2a37; }
  .letterhead { text-align: center; border-bottom: 3px double #6d28d9; padding-bottom: 14px; margin-bottom: 20px; }
  .school { font-size: 23px; font-weight: bold; color: #0f172a; letter-spacing: 0.02em; }
  .aff { font-size: 11px; color: #4b5563; margin-top: 4px; }
  .contact { font-size: 10px; color: #6b7280; margin-top: 2px; }
  h1 { text-align: center; font-size: 14px; letter-spacing: 0.28em; margin: 16px 0 4px; color: #5b21b6; }
  .docmeta { display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; margin: 0 0 14px; font-family: ui-monospace, monospace; }
  h2 { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #5b21b6; margin: 18px 0 6px; }
  table.meta td, table.meta th { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 12px; }
  table.meta th { background: #f8fafc; text-align: left; width: 32%; color: #4b5563; }
  table.data { border-collapse: collapse; width: 100%; margin: 8px 0; }
  table.data th, table.data td { border: 1px solid #9ca3af; padding: 6px 10px; font-size: 12px; vertical-align: top; text-align: left; }
  table.data thead th { background: #f5f3ff; color: #4c1d95; }
  .item { border-left: 2px solid #ddd6fe; padding: 2px 0 2px 12px; margin: 10px 0; }
  .item-head { font-size: 13px; }
  .item-head strong { color: #0f172a; }
  .item-meta { color: #6b7280; font-size: 10.5px; margin-left: 8px; font-family: ui-monospace, monospace; }
  .item-note { font-size: 10.5px; color: #92400e; margin-top: 2px; }
  .item-note.muted { color: #6b7280; }
  .item-desc { font-size: 12px; line-height: 1.6; margin-top: 3px; }
  .item-skills { font-size: 10.5px; margin-top: 3px; color: #374151; }
  .item-skills .lbl { text-transform: uppercase; letter-spacing: 0.08em; font-size: 9px; color: #6b7280; margin-right: 4px; }
  .muted { color: #6b7280; }
  .small { font-size: 9.5px; }
  .ev { font-size: 11.5px; margin: 2px 0; }
  .ev .muted { font-size: 10px; }
  .footnote { border-top: 1px solid #e5e7eb; margin-top: 28px; padding-top: 10px; font-size: 9.5px; color: #6b7280; line-height: 1.6; }
  .issued { text-align: center; font-size: 9px; color: #9ca3af; margin-top: 18px; font-family: ui-monospace, monospace; letter-spacing: 0.04em; }
  @media print { body { margin: 10mm auto; } .item { break-inside: avoid; } table.data tr { break-inside: avoid; } }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="school">${esc(school.name)}</div>
    <div class="aff">${esc(school.affiliation)}</div>
    <div class="contact">${esc(school.address)}</div>
  </div>
  <h1>STUDENT PORTFOLIO</h1>
  <div class="docmeta"><span>Session ${esc(school.academicYear)}</span><span>Compiled ${esc(compiledOn)}</span></div>
  <table class="meta">
    <tr><th>Student Name</th><td>${esc(input.student.name)}</td></tr>
    <tr><th>Class / Section</th><td>${esc(input.student.classSection)}</td></tr>
    ${input.student.admissionNo ? `<tr><th>Admission No</th><td>${esc(input.student.admissionNo)}</td></tr>` : ''}
    ${input.student.rollNo ? `<tr><th>Roll No</th><td>${esc(input.student.rollNo)}</td></tr>` : ''}
  </table>

  ${featuredSection}
  ${groupsSection}
  ${skillsSection}

  <div class="footnote">
    This portfolio is a record of work selected by the student. Entries marked “Recognised achievement” are drawn from the
    school’s achievements record; entries marked “Added by student” were selected and described by the student. Skill
    evidence lists only the real portfolio entries and achievements carrying each skill tag.
  </div>
  <div class="issued">Compiled on ${esc(compiledOn)} · issued electronically by ${esc(school.name)}</div>
</body>
</html>`
}

/** File name for the portfolio download (same mechanics as the fee statement). */
export function portfolioFileName(studentName: string): string {
  const base = `Student Portfolio ${studentName}`.replace(/[^A-Za-z0-9\-_ ]/g, '').replace(/\s+/g, '_').slice(0, 80)
  return `${base || 'student_portfolio'}.html`
}
