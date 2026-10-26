import React from 'react';
import { Booking, Lead } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import { approveBooking, localStore } from '../services/crmService';
import { CheckCircle2, DollarSign, ShieldCheck, FileCheck, Building, AlertCircle, ExternalLink } from 'lucide-react';

interface BookingModuleProps {
  onSelectLead?: (lead: Lead) => void;
}

export const BookingModule: React.FC<BookingModuleProps> = ({ onSelectLead }) => {
  const { currentUser, selectedEmployeeFilter, isAdmin } = useAuth();

  let bookings = localStore.bookings;

  if (selectedEmployeeFilter !== 'ALL') {
    bookings = bookings.filter(b => b.employeeId === selectedEmployeeFilter);
  }

  const handleLeadClick = (leadId: string, customerPhone?: string, customerName?: string) => {
    if (!onSelectLead) return;
    const cleanPhone = (p?: string) => (p || '').replace(/\D/g, '');
    const found =
      localStore.leads.find(l => l.id === leadId) ||
      localStore.leads.find(l => customerPhone && cleanPhone(l.phone).includes(cleanPhone(customerPhone))) ||
      localStore.leads.find(l => customerName && l.customerName.toLowerCase() === customerName.toLowerCase());
    if (found) {
      onSelectLead(found);
    }
  };

  const totalBookedValue = bookings.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);
  const totalTokensCollected = bookings.reduce((sum, b) => sum + (b.tokenAmount || 0), 0);

  const handleApprove = async (bookingId: string) => {
    const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };
    await approveBooking(bookingId, actor);
  };

  return (
    <div className="space-y-4">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-1 transition-colors">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Confirmed Bookings</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{bookings.length} Units</p>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-1 transition-colors">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Agreed Sales Volume</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            ₹{(totalBookedValue / 10000000).toFixed(2)} Cr
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-1 transition-colors">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Tokens Collected</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
            ₹{(totalTokensCollected / 100000).toFixed(1)} Lakhs
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100/75 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 text-xs">
              <tr>
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">Project & Unit No.</th>
                <th className="p-3.5">Agreed Sale Price</th>
                <th className="p-3.5">Token Paid</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Sales Employee</th>
                <th className="p-3.5">Admin Approval</th>
                <th className="p-3.5 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400 dark:text-neutral-500">
                    No booking records found.
                  </td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="p-3.5">
                      <button
                        onClick={() => handleLeadClick(b.leadId, b.customerPhone, b.customerName)}
                        className="text-left group/lead cursor-pointer"
                        title="Click to view 360° Lead Details"
                      >
                        <div className="font-bold text-neutral-900 dark:text-white group-hover/lead:underline flex items-center gap-1.5 text-base">
                          <span>{b.customerName}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover/lead:text-black dark:group-hover/lead:text-white transition-colors" />
                        </div>
                        <div className="font-mono text-neutral-500 dark:text-neutral-400 text-sm">{b.customerPhone}</div>
                      </button>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-neutral-900 dark:text-white text-base">{b.projectName}</div>
                      <div className="font-mono text-neutral-600 dark:text-neutral-400 font-semibold text-sm">Unit: {b.unitNumber}</div>
                    </td>
                    <td className="p-3.5 font-mono text-neutral-900 dark:text-white font-bold text-base">
                      ₹{b.agreedPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-mono text-neutral-900 dark:text-white font-bold text-base">
                      ₹{b.tokenAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-neutral-700 dark:text-neutral-300 font-medium">{b.paymentMode}</td>
                    <td className="p-3.5 text-neutral-700 dark:text-neutral-300 font-medium">{b.employeeName}</td>
                    <td className="p-3.5">
                      {b.adminApproved ? (
                        <span className="px-2.5 py-1 bg-black text-white dark:bg-white dark:text-black rounded-md text-xs font-bold flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-md text-xs font-bold flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3.5 h-3.5" /> Review Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {isAdmin && !b.adminApproved ? (
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Approve Booking
                        </button>
                      ) : (
                        <span className="text-sm text-neutral-400 font-mono">Confirmed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingModule;
