import React, { useState, useEffect } from 'react';
import { Upload, X, Move, ZoomIn } from 'lucide-react';


export default function AddAnnouncementModal({ isOpen, onClose, onAdd, onEdit, editData }) {
    const isEdit = !!editData;
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    // Image Adjustment State
    const [zoom, setZoom] = useState(1); // Scale 1 to 3
    const [posX, setPosX] = useState(50); // 0% to 100%
    const [posY, setPosY] = useState(50); // 0% to 100%
    const [loading, setLoading] = useState(false);

    // Populate or Reset form when modal opens/changes
    useEffect(() => {
        if (isOpen) {
            if (isEdit && editData) {
                setTitle(editData.title || '');
                setDescription(editData.description || '');
                setImagePreview(editData.image || null);
                // Load existing styles or defaults
                setZoom(editData.style?.zoom || 1);
                setPosX(editData.style?.posX ?? 50);
                setPosY(editData.style?.posY ?? 50);
            } else {
                // Reset for Add Mode
                setTitle('');
                setDescription('');
                setImagePreview(null);
                setZoom(1);
                setPosX(50);
                setPosY(50);
            }
        }
    }, [isOpen, isEdit, editData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                // Reset adjustments on new image
                setZoom(1);
                setPosX(50);
                setPosY(50);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const finalImage = imagePreview || "/Frame 56.png";
        const payload = {
            title,
            description,
            image: finalImage,
            style: {
                zoom,
                posX,
                posY
            }
        };
        if (isEdit) {
            await onEdit({ ...editData, ...payload });
        } else {
            await onAdd(payload);
        }
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[450px] overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#815FB3] p-5 flex justify-between items-center">
                    <h2 className="text-white font-bold text-xl">
                        {isEdit ? 'Edit Promotion' : 'New Promotion'}
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:bg-white/20 rounded-full p-1 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fc]">
                    {/* --- PREVIEW CARD --- */}
                    <div className="bg-white rounded-[18px] shadow-lg border border-[#e0d7f7] overflow-hidden mb-6">
                        {/* Image Area - UPDATED: aspect-[4/3] and object-contain */}
                        <div className="relative w-full aspect-[4/3] bg-[#f0ebf8] overflow-hidden group">
                            {imagePreview ? (
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-full object-contain transition-transform duration-100"
                                    style={{
                                        transform: `scale(${zoom})`,
                                        objectPosition: `${posX}% ${posY}%`
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#815FB3]/60">
                                    <Upload size={40} className="mb-2"/>
                                    <span className="text-xs font-bold uppercase tracking-wide">Upload Image</span>
                                </div>
                            )}
                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {/* Hover Overlay Hint */}
                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center pointer-events-none z-20">
                                <span className="text-white font-bold text-sm tracking-wider">CLICK TO REPLACE</span>
                            </div>
                        </div>

                        {/* Content Preview */}
                        <div className="p-5 border-t border-gray-100">
                            <input
                                type="text"
                                className="w-full font-bold text-lg text-[#181818] placeholder-gray-300 focus:outline-none bg-transparent mb-2"
                                placeholder="Promotion Title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                maxLength={30}
                            />
                            <textarea
                                className="w-full text-sm text-[#555] placeholder-gray-300 focus:outline-none bg-transparent resize-none"
                                placeholder="Description..."
                                rows={2}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* --- IMAGE ADJUSTMENT CONTROLS --- */}
                    {imagePreview && (
                        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Image Adjustments</h3>
                            {/* Zoom Control */}
                            <div className="flex items-center gap-3">
                                <ZoomIn size={16} className="text-gray-400" />
                                <input 
                                    type="range" min="1" max="3" step="0.1" 
                                    value={zoom} 
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full accent-[#815FB3] h-2 rounded-lg cursor-pointer"
                                />
                            </div>
                            {/* Position Controls */}
                            <div className="flex items-center gap-3">
                                <Move size={16} className="text-gray-400" />
                                <div className="flex-1 flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-400 block mb-1">Horizontal</label>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={posX} 
                                            onChange={(e) => setPosX(parseInt(e.target.value))}
                                            className="w-full accent-[#815FB3] h-2 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-gray-400 block mb-1">Vertical</label>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={posY} 
                                            onChange={(e) => setPosY(parseInt(e.target.value))}
                                            className="w-full accent-[#815FB3] h-2 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={loading || !title || !description}
                            className="flex-1 py-3 rounded-xl bg-[#815FB3] text-white font-bold shadow-lg hover:bg-[#6d4fa1] transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Publish')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        );
}
