import { useRef } from 'react';
import { Upload, Building2 } from 'lucide-react';
import { BuildingData } from '../types';

interface BuildingSelectorProps {
  onLoadDemo: (id: string) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  currentBuilding: BuildingData | null;
}

export function BuildingSelector({ onLoadDemo, onUpload, currentBuilding }: BuildingSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative group">
        <button className="flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg border border-slate-700 transition-colors text-slate-200 shadow-sm">
          <Building2 className="w-4 h-4 mr-2 text-blue-400" />
          Load Demo
        </button>
        <div className="absolute bottom-full left-0 mb-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
          <button 
            onClick={() => onLoadDemo('a')}
            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/80 rounded-lg transition-colors flex flex-col"
          >
            <span className="font-medium">Building A</span>
            <span className="text-[11px] text-slate-400">Corporate HQ • 12 Zones, 2 Exits</span>
          </button>
          <button 
            onClick={() => onLoadDemo('b')}
            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/80 rounded-lg transition-colors flex flex-col mt-1"
          >
            <span className="font-medium">Building B</span>
            <span className="text-[11px] text-slate-400">Medical Center • ICU, Ward, 3 Exits</span>
          </button>
        </div>
      </div>

      <div className="h-5 w-px bg-slate-700/80 mx-2" />

      <input
        type="file"
        accept="image/*,.png,.jpg,.jpeg"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg border border-slate-700 transition-colors text-slate-200 shadow-sm"
      >
        <Upload className="w-4 h-4 mr-2 text-emerald-400" />
        Upload Floorplan
      </button>

      {currentBuilding && (
        <span className="ml-3 text-xs text-slate-400 font-mono bg-slate-800/80 px-2 py-1 rounded border border-slate-800">
          {currentBuilding.zones.length} zones online
        </span>
      )}
    </div>
  );
}
