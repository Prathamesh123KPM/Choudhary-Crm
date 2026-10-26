import React, { useState } from 'react';
import { Project, InventoryUnit } from '../types/crm';
import { useAuth } from '../context/AuthContext';
import { addProject, localStore } from '../services/crmService';
import { Building, MapPin, Tag, Plus, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ProjectsModule: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'inventory'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  // New Project Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<Project['category']>('Residential Apartment');
  const [startingPrice, setStartingPrice] = useState(6500000);
  const [description, setDescription] = useState('');
  const [possessionDate, setPossessionDate] = useState('December 2027');
  const [reraNumber, setReraNumber] = useState('P52100099887');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600');
  const [availableConfig, setAvailableConfig] = useState('2 BHK, 3 BHK');

  const projects = localStore.projects;
  let inventory = localStore.inventory;

  if (selectedProjectId !== 'ALL') {
    inventory = inventory.filter(i => i.projectId === selectedProjectId);
  }

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const actor = { id: currentUser.uid, name: currentUser.displayName, role: currentUser.role };
    await addProject(
      {
        name,
        location,
        address,
        category,
        startingPrice: Number(startingPrice),
        description,
        possessionDate,
        status: 'Under Construction',
        reraNumber,
        imageUrl,
        availableConfigurations: availableConfig
      },
      actor
    );
    setShowAddProjectModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Module Header & Tab bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Projects & Unit Inventory</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Property catalogs, RERA registrations, floor plans, and real-time unit availability.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'projects' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
            >
              Flat Units ({localStore.inventory.length})
            </button>
          </div>

          {isAdmin && activeTab === 'projects' && (
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              + Add New Project
            </button>
          )}
        </div>
      </div>

      {/* PROJECTS GRID */}
      {activeTab === 'projects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(proj => (
            <div key={proj.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between transition-colors">
              {proj.imageUrl ? (
                <div className="relative h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/80 dark:bg-white/90 backdrop-blur text-white dark:text-black text-[10px] font-bold rounded-lg shadow-sm">
                    {proj.category}
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-sm shadow-xs">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        {proj.status}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[10px] font-bold rounded-lg border border-neutral-200 dark:border-neutral-700">
                    {proj.category}
                  </span>
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">{proj.name}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-neutral-900 dark:text-white shrink-0" /> {proj.location}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-2 leading-relaxed">{proj.description}</p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Starting Price:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">₹{(proj.startingPrice / 100000).toFixed(1)} Lakhs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">RERA No:</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{proj.reraNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Possession:</span>
                    <span className="text-neutral-900 dark:text-white font-semibold">{proj.possessionDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* INVENTORY UNITS TABLE */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Filter by Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-black dark:focus:border-white"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100/75 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 text-xs">
                  <tr>
                    <th className="p-3.5">Unit / Flat No.</th>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">Building / Wing</th>
                    <th className="p-3.5">Unit Type</th>
                    <th className="p-3.5">Carpet Area</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200">
                  {inventory.map(u => (
                    <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-neutral-900 dark:text-white font-mono">{u.unitNumber}</td>
                      <td className="p-3.5 font-semibold text-neutral-900 dark:text-white">{u.projectName}</td>
                      <td className="p-3.5 text-neutral-700 dark:text-neutral-300">{u.buildingWing} (Floor {u.floorNumber})</td>
                      <td className="p-3.5 font-medium text-neutral-800 dark:text-neutral-200">{u.unitType}</td>
                      <td className="p-3.5 font-mono text-neutral-600 dark:text-neutral-400">{u.carpetAreaSqFt} sqft</td>
                      <td className="p-3.5 font-mono text-neutral-900 dark:text-white font-bold">₹{(u.price / 100000).toFixed(1)} Lakhs</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'Available'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : u.status === 'Booked'
                            ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-neutral-900 dark:text-neutral-100 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Add New Real Estate Project</h3>
            <form onSubmit={handleAddProjectSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Project Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white" placeholder="e.g. Jeevika Heights" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Location Area</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white" placeholder="Palghar East" />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Starting Price (₹)</label>
                  <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(Number(e.target.value))} required className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-black dark:focus:border-white" />
                </div>
              </div>
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-semibold">Project Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-black dark:focus:border-white" placeholder="Luxury apartments with clubhouse..." />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button type="button" onClick={() => setShowAddProjectModal(false)} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg text-xs font-bold cursor-pointer">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsModule;
