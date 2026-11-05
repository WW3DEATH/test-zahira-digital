import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  BookOpen,
  Search,
  Download,
  CheckSquare,
  Clock,
  Award,
  AlertTriangle,
  Beaker,
  FileText,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PRACTICAL_GUIDES, PracticalGuide } from '../../data/practicalGuidesData';

interface PracticalGuidesRepositoryProps {
  onOpenChecklist: (guideId: string) => void;
}

export const PracticalGuidesRepository: React.FC<PracticalGuidesRepositoryProps> = ({ onOpenChecklist }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'all' | 'bio' | 'physics' | 'maths' | 'chemistry'>('all');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter guides
  const filteredGuides = PRACTICAL_GUIDES.filter((guide) => {
    const matchesDiscipline = selectedDiscipline === 'all' || guide.discipline === selectedDiscipline;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      guide.title.toLowerCase().includes(query) ||
      guide.code.toLowerCase().includes(query) ||
      guide.subjectName.toLowerCase().includes(query) ||
      guide.syllabusUnit.toLowerCase().includes(query) ||
      guide.aim.toLowerCase().includes(query);
    return matchesDiscipline && matchesSearch;
  });

  // Export Standard Official Experiment Guide PDF
  const handleDownloadGuidePDF = (guide: PracticalGuide) => {
    setDownloadingId(guide.id);
    try {
      const doc = new jsPDF();

      // Header: Official Zahira College Identity
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('ZAHIRA COLLEGE MAWANELLA • 2K28 SCIENCE EM', 20, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text('G.C.E. ADVANCED LEVEL OFFICIAL PRACTICAL EXPERIMENT GUIDE & MANUAL', 20, 26);
      doc.text(`Academic Discipline: ${guide.subjectName} • ${guide.stream}`, 20, 31);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 35, 190, 35);

      // Metadata Banner
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(20, 39, 170, 16, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Syllabus Code: ${guide.code}`, 24, 45);
      doc.text(`Syllabus Unit: ${guide.syllabusUnit}`, 24, 51);
      doc.text(`Recommended Duration: ${guide.duration}`, 125, 45);
      doc.text('A/L 2028 Batch Curriculum', 125, 51);

      // Experiment Title
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(20, 59, 170, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(67, 56, 202);
      doc.text(`Title: ${guide.title}`, 24, 65.5);

      let y = 77;

      // 1. Aim
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Practical Aim & Objectives', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const aimLines = doc.splitTextToSize(guide.aim, 170);
      doc.text(aimLines, 20, y);
      y += aimLines.length * 4.5 + 4;

      // 2. Learning Competencies
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Key Learning Competencies', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      guide.learningCompetencies.forEach((comp) => {
        const compLines = doc.splitTextToSize(`• ${comp}`, 168);
        doc.text(compLines, 22, y);
        y += compLines.length * 4.2;
      });
      y += 4;

      // 3. Apparatus, Materials & Reagents
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Required Apparatus & Materials', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      guide.apparatus.forEach((app) => {
        const appLines = doc.splitTextToSize(`- ${app}`, 168);
        doc.text(appLines, 22, y);
        y += appLines.length * 4.2;
      });
      y += 4;

      // 4. Safety Warnings & Precautions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(185, 28, 28); // red
      doc.text('4. Safety Protocols & Precautions', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(153, 27, 27);
      guide.safetyPrecautions.forEach((safe) => {
        const safeLines = doc.splitTextToSize(`! ${safe}`, 168);
        doc.text(safeLines, 22, y);
        y += safeLines.length * 4.2;
      });
      y += 6;

      // Page break check before procedure
      if (y > 220) {
        doc.addPage();
        y = 25;
      }

      // 5. Theoretical Background & Key Formulas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('5. Theoretical Principle & Formulations', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const theoryLines = doc.splitTextToSize(guide.theoreticalBackground, 170);
      doc.text(theoryLines, 20, y);
      y += theoryLines.length * 4.2 + 3;

      guide.keyFormulas.forEach((formula) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(`  [Formula] ${formula}`, 22, y);
        y += 4.5;
      });
      y += 4;

      // Page break check before procedure steps
      if (y > 200) {
        doc.addPage();
        y = 25;
      }

      // 6. Step-by-Step Laboratory Protocol
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('6. Step-by-Step Laboratory Protocol', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      guide.procedureSteps.forEach((step, idx) => {
        const stepLines = doc.splitTextToSize(`${idx + 1}. ${step}`, 168);
        doc.text(stepLines, 22, y);
        y += stepLines.length * 4.2 + 1;
        if (y > 270) {
          doc.addPage();
          y = 25;
        }
      });
      y += 4;

      // Page break for observation table and certification
      if (y > 220) {
        doc.addPage();
        y = 25;
      }

      // 7. Observation Template Columns
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('7. OBSERVATION TABLE & DATA LOGGING TEMPLATE', 24, y + 4.8);
      y += 11;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Table Headers: ${guide.observationColumns.join('  |  ')}`,
        20,
        y
      );
      y += 14;

      // End of Guide Certification Block
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Official Practical Manual Certified by Academic Administration:', 20, y);

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Zahira College Mawanella Science Project management', 20, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Faculty Authorized • G.C.E. Advanced Level Science Curriculum Repository', 20, y);

      doc.save(`Zahira_Practical_Guide_${guide.code}.pdf`);
    } catch (e) {
      console.error('Failed to export guide PDF:', e);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search practical guides by syllabus code, topic, or keyword (e.g. MATH-MECH-01, Lami, Titration, Pendulum)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Discipline Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Guides (13)' },
              { id: 'maths', label: 'Combined Maths (5)' },
              { id: 'physics', label: 'Physics (4)' },
              { id: 'bio', label: 'Biological Science (3)' },
              { id: 'chemistry', label: 'Chemistry (1)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedDiscipline(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedDiscipline === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGuides.map((guide) => {
          const isExpanded = expandedGuideId === guide.id;

          return (
            <div
              key={guide.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {guide.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    guide.discipline === 'maths'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : guide.discipline === 'bio'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : guide.discipline === 'chemistry'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                  }`}>
                    {guide.subjectName}
                  </span>
                </div>

                <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {guide.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {guide.aim}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{guide.duration}</span>
                  </span>
                  <span>•</span>
                  <span>{guide.syllabusUnit}</span>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                        Core Formulas & Relationships:
                      </span>
                      <div className="space-y-1">
                        {guide.keyFormulas.map((f, i) => (
                          <p key={i} className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                            {f}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                        Required Apparatus & Specimen:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        {guide.apparatus.map((app, i) => (
                          <li key={i}>{app}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300">
                      <span className="font-bold block mb-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Safety Protocol:</span>
                      </span>
                      {guide.safetyPrecautions[0]}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                >
                  <span>{isExpanded ? 'Hide Details' : 'View Protocol Details'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenChecklist(guide.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Checklist</span>
                  </button>

                  <button
                    onClick={() => handleDownloadGuidePDF(guide)}
                    disabled={downloadingId === guide.id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                    title="Download Official Practical Experiment Guide PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>{downloadingId === guide.id ? 'Generating...' : 'PDF Guide'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
