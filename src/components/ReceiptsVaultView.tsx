import React, { useState } from 'react';
import {
  FolderLock,
  Plus,
  Search,
  Download,
  Trash2,
  Eye,
  FileText,
  FileCheck,
  Shield,
  X,
  Upload,
  Calendar,
} from 'lucide-react';
import { FullHouseholdDatabase, ReceiptDocument } from '../types';
import { formatDate } from '../utils/formatters';

interface ReceiptsVaultViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const ReceiptsVaultView: React.FC<ReceiptsVaultViewProps> = ({
  database,
  onUpdateDatabase,
}) => {
  const easy = database.settings.easyWording;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ReceiptDocument | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Shopping Receipt' as ReceiptDocument['category'],
    notes: '',
    fileName: '',
    fileSize: '1.2 MB',
    fileData: '',
  });

  const categories = [
    'Shopping Receipt',
    'Grocery Bill',
    'Electricity Bill',
    'Gas Bill',
    'Water Bill',
    'Warranty Card',
    'Property Document',
    'Other Document',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          fileName: file.name,
          fileSize: sizeStr,
          fileData: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please enter document title');
      return;
    }

    const newDoc: ReceiptDocument = {
      id: `doc_${Date.now()}`,
      title: formData.title,
      category: formData.category,
      uploadDate: new Date().toISOString().slice(0, 10),
      fileName: formData.fileName || 'household_document.pdf',
      fileSize: formData.fileSize || '1.1 MB',
      fileData: formData.fileData,
      notes: formData.notes,
    };

    onUpdateDatabase({
      ...database,
      receiptDocuments: [newDoc, ...database.receiptDocuments],
    });

    setIsModalOpen(false);
  };

  const handleDeleteDoc = (id: string) => {
    if (window.confirm('Delete this stored document?')) {
      const updated = database.receiptDocuments.filter((d) => d.id !== id);
      onUpdateDatabase({ ...database, receiptDocuments: updated });
    }
  };

  const handleDownload = (doc: ReceiptDocument) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName;
      link.click();
    } else {
      alert(`Downloading ${doc.fileName}... (Demo archive file simulated)`);
    }
  };

  const filteredDocs = database.receiptDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-teal-600" />
            {easy ? 'Rasidain aur Files (Receipts & Documents)' : 'Receipts & Document Storage Vault'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Shopping rasidain, bijli ke bill, warranty card aur property agreement mehfooz karein'
              : 'Secure digital repository for shopping bills, warranty slips, property papers, and utility vouchers'}
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              category: 'Shopping Receipt',
              notes: '',
              fileName: '',
              fileSize: '1.2 MB',
              fileData: '',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Upload Document</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search document title, notes, or file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Document Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">
                      {doc.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                      {doc.title}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-mono text-[11px] truncate">{doc.fileName}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Size: {doc.fileSize}</span>
                  <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                </div>
              </div>

              {doc.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {doc.notes}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
              {doc.fileData && (
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-2.5 py-1 text-teal-600 dark:text-teal-400 font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              )}
              <button
                onClick={() => handleDownload(doc)}
                className="px-2.5 py-1 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600" />
                Upload Receipt or Household Document
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haier AC Warranty Slip 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as any })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select File (Image / Document Scan)
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950 dark:file:text-teal-300 hover:file:bg-teal-100"
                />
                {formData.fileName && (
                  <span className="text-[11px] text-teal-600 mt-1 block">
                    Selected: {formData.fileName} ({formData.fileSize})
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keep safe for future warranty claim"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-4 shadow-2xl">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {previewDoc.title}
            </h4>
            <img
              src={previewDoc.fileData}
              alt={previewDoc.title}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
