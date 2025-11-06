import React from 'react';
import AdminTopNav from './AdminTopNav';
import { Pencil, Trash2, ChevronDown } from 'lucide-react';
// Inline SVG paths to avoid import error
const svgPaths = {
  p337ed400: "M45 0C69.8528 0 90 20.1472 90 45C90 69.8528 69.8528 90 45 90C20.1472 90 0 69.8528 0 45C0 20.1472 20.1472 0 45 0ZM45 10C25.67 10 10 25.67 10 45C10 64.33 25.67 80 45 80C64.33 80 80 64.33 80 45C80 25.67 64.33 10 45 10Z",
  p42c7280: "M45 0C69.8528 0 90 20.1472 90 45C90 69.8528 69.8528 90 45 90C20.1472 90 0 69.8528 0 45C0 20.1472 20.1472 0 45 0ZM45 10C25.67 10 10 25.67 10 45C10 64.33 25.67 80 45 80C64.33 80 80 64.33 80 45C80 25.67 64.33 10 45 10Z",
  p36599200: "M40 0C62.0914 0 80 17.9086 80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0ZM40 8C22.327 8 8 22.327 8 40C8 57.673 22.327 72 40 72C57.673 72 72 57.673 72 40C72 22.327 57.673 8 40 8Z",
  p31c3c2f0: "M12.5 0C19.4036 0 25 5.59644 25 12.5C25 19.4036 19.4036 25 12.5 25C5.59644 25 0 19.4036 0 12.5C0 5.59644 5.59644 0 12.5 0ZM12.5 2.08333C6.69792 2.08333 2.08333 6.69792 2.08333 12.5C2.08333 18.3021 6.69792 22.9167 12.5 22.9167C18.3021 22.9167 22.9167 18.3021 22.9167 12.5C22.9167 6.69792 18.3021 2.08333 12.5 2.08333Z",
  p3eb8a280: "M2 2L21 21M21 2L2 21",
  paa21800: "M10.5 0C16.299 0 21 4.70101 21 10.5C21 16.299 16.299 21 10.5 21C4.70101 21 0 16.299 0 10.5C0 4.70101 4.70101 0 10.5 0ZM10.5 2.08333C5.69792 2.08333 2.08333 5.69792 2.08333 10.5C2.08333 15.3021 5.69792 18.9167 10.5 18.9167C15.3021 18.9167 18.9167 15.3021 18.9167 10.5C18.9167 5.69792 15.3021 2.08333 10.5 2.08333Z"
};

function renderIcon(iconType) {
  switch (iconType) {
    case 'syringe':
      return (
        <div className="w-[50px] h-[50px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 90">
            <path clipRule="evenodd" d={svgPaths.p337ed400} fill="var(--fill-0, #57166B)" fillRule="evenodd" />
          </svg>
        </div>
      );
    case 'checkup':
      return (
        <div className="w-[50px] h-[50px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 90">
            <path clipRule="evenodd" d={svgPaths.p42c7280} fill="var(--fill-0, #57166B)" fillRule="evenodd" />
          </svg>
        </div>
      );
    case 'paw':
      return (
        <div className="w-[50px] h-[50px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 80 80">
            <g clipPath="url(#clip0_1_97)">
              <path d={svgPaths.p36599200} fill="var(--fill-0, #57166B)" />
            </g>
            <defs>
              <clipPath id="clip0_1_97">
                <rect fill="white" height="80" width="80" />
              </clipPath>
            </defs>
          </svg>
        </div>
      );
    default:
      return null;
  }
}

const announcementsData = [
  {
    id: 1,
    title: "Summer Vaccination Special",
    validUntil: "July 30, 2025",
    description: "Get 20% off all vaccinations during June and July. Keep your pets protected for less!",
    icon: 'syringe',
  },
  {
    id: 2,
    title: "Senior Pet Wellness Month",
    validUntil: "August 15, 2025",
    description: "Comprehensive check-ups for senior pets at a special rate. Includes blood work and arthritis screening.",
    icon: 'checkup',
  },
  {
    id: 3,
    title: "New Client Welcome Package",
    validUntil: "Ongoing",
    description: "First-time clients receive 15% off their initial consultation and a free pet care kit.",
    icon: 'paw',
  }
];

export default function AdminAnnouncements() {
  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <AdminTopNav activePage="Announcements" />
      {/* Main Content */}
      <div className="pt-[110px] pb-12 flex flex-col items-center w-full">
        <div className="w-full max-w-[900px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-['Raleway:Bold',sans-serif] font-bold text-[32px] text-black tracking-[1.6px]">Announcement Management</h2>
            <button className="bg-[#bba0e4] hover:bg-[#a88ad2] text-black font-['Inter:Semi_Bold',sans-serif] font-semibold text-[15px] px-6 py-2 rounded-[5px] shadow">+ New Announcement</button>
          </div>
          <div className="flex flex-col gap-7">
            {announcementsData.map((card) => (
              <div key={card.id} className="bg-[#f7f5fc] rounded-[15px] border border-[#d1c4e9] shadow px-8 py-7 flex flex-col md:flex-row items-center md:items-start relative w-full">
                <div className="mb-4 md:mb-0 md:mr-8 flex-shrink-0 flex items-center justify-center" style={{ minWidth: 70 }}>
                  {renderIcon(card.icon)}
                </div>
                <div className="flex-1 w-full">
                  <h3 className="font-['Raleway:Bold',sans-serif] font-bold text-[28px] text-black mb-1 tracking-[1.4px]">{card.title}</h3>
                  <p className="font-['Raleway:Light',sans-serif] text-[15px] text-[#57166B] mb-2 tracking-[0.75px]">Valid until: {card.validUntil}</p>
                  <p className="font-['Raleway:Light',sans-serif] text-[18px] text-black tracking-[1px]">{card.description}</p>
                </div>
                <div className="absolute right-8 top-8 flex gap-2">
                  <button className="p-2 rounded hover:bg-[#f3f0fa] border border-[#bba0e4]" title="Edit">
                    <Pencil className="w-6 h-6 text-[#57166B]" />
                  </button>
                  <button className="p-2 rounded hover:bg-[#f3f0fa] border border-[#bba0e4]" title="Delete">
                    <Trash2 className="w-5 h-5 text-[#57166B]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination at the bottom */}
          <div className="flex items-center justify-center gap-2 mt-12 pb-2">
            <button className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black">
              <ChevronDown className="w-[11px] h-[21px] rotate-90" />
            </button>
            <div className="bg-[#815fb3] w-[27px] h-[27px] rounded-[5px] flex items-center justify-center">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-white">1</span>
            </div>
            <button className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black">
              <ChevronDown className="w-[11px] h-[21px] -rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}