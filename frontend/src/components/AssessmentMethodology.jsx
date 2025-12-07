import React, { useState } from 'react';

const AssessmentMethodology = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-6 w-full" style={{ fontFamily: 'Raleway' }}>
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
      >
        <span className="text-[13px] font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
          <img 
            src="/gg_notes.png" 
            alt="Methodology" 
            className="w-4 h-4 object-contain" 
          />
          About This Assessment Methodology
        </span>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-3 border-2 border-gray-300 rounded-lg p-5 bg-white shadow-sm">
          <h3 className="text-[16px] font-bold text-gray-900 mb-3 flex items-center gap-2">
            <img 
              src="/gg_notes.png" 
              alt="Clinical" 
              className="w-4 h-4 object-contain" 
            />
            Clinical Methodology
          </h3>

          <div className="space-y-4 text-[13px] text-gray-800 leading-relaxed">
            <p>
              This assessment tool is designed following established veterinary triage and clinical
              assessment protocols:
            </p>

            {/* Emergency Screening */}
            <div>
              <h4 className="font-bold text-[14px] text-gray-900 mb-2">Emergency Screening:</h4>
              <div className="pl-4 space-y-1">
                <p>
                  <strong>• RAP System (Respiration, Alertness, Perfusion)</strong>
                </p>
                <p className="pl-4 text-gray-700">
                  - Standard veterinary triage method
                </p>
                <p className="pl-4 text-gray-700">
                  - Quickly assesses major body systems
                </p>
              </div>
            </div>

            {/* Symptom Organization */}
            <div>
              <h4 className="font-bold text-[14px] text-gray-900 mb-2">Symptom Organization:</h4>
              <div className="pl-4 space-y-1">
                <p>
                  <strong>• Body System Approach</strong>
                </p>
                <p className="pl-4 text-gray-700">
                  - Based on Veterinary Triage List (VTL)
                </p>
                <p className="pl-4 text-gray-700">
                  - Adapted from Manchester Triage Scale
                </p>
                <p className="pl-4 text-gray-700">
                  - Organizes by: Respiratory, Gastrointestinal, Neurological, Urogenital,
                  Musculoskeletal, Generalised/External systems
                </p>
              </div>
            </div>

            {/* Assessment Components */}
            <div>
              <h4 className="font-bold text-[14px] text-gray-900 mb-2">Assessment Components:</h4>
              <div className="pl-4 space-y-1 text-gray-700">
                <p>• Chief Complaint (open-ended)</p>
                <p>• Systematic symptom review</p>
                <p>• Severity and duration assessment</p>
                <p>• Progression tracking</p>
                <p>• Species-specific considerations</p>
              </div>
            </div>

            {/* Sources */}
            <div className="border-t border-gray-300 pt-4">
              <h4 className="font-bold text-[14px] text-gray-900 mb-2">Sources & References:</h4>
              <div className="pl-4 space-y-1 text-gray-700">
                <p>• Veterinary telephone triage guidelines</p>
                <p>
                  • RAP triage system{' '}
                  <span className="italic">(VETgirl, Amy Newfield, CVT, VTS (ECC))</span>
                </p>
                <p>
                  • Veterinary Triage List{' '}
                  <span className="italic">(Ruys et al., 2012)</span>
                </p>
                <p>• Standard emergency indicators</p>
                <p>
                  • VetHelp UK, PetMD, Merck Veterinary Manual
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border-t-2 border-amber-300 pt-4 bg-amber-50 -mx-5 -mb-5 px-5 pb-5 mt-4 rounded-b-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-[13px] text-amber-900 mb-1">Important Notice:</p>
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    This tool provides guidance only. It does not replace professional veterinary
                    diagnosis and care. If you have concerns about your pet&apos;s health, please consult
                    a licensed veterinarian immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentMethodology;
