import React, { useState, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import {
    Download,
    RotateCcw,
    Image as ImageIcon,
    Type,
    Maximize,
    Layout,
    Palette,
    AlignHorizontalSpaceAround,
    AlignVerticalSpaceAround,
    Check,
    ZoomIn,
    Crop as CropIcon,
    Expand,
    SlidersHorizontal
} from 'lucide-react';

const PostcardMaker = () => {
    // --- Core State ---
    const [orientation, setOrientation] = useState('landscape'); // landscape | portrait
    const [side, setSide] = useState('front'); // front | back

    // --- Content State ---
    const [image, setImage] = useState(null);
    // Cropper State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [filter, setFilter] = useState('none');
    const [filterIntensity, setFilterIntensity] = useState(100);

    const [template, setTemplate] = useState('exhibition'); // exhibition | basic | blank
    const [fontStyle, setFontStyle] = useState('sans'); // sans | serif
    const [accentColor, setAccentColor] = useState('#1a1a1a');

    // --- Text State ---
    const [titleText, setTitleText] = useState('My Postcard Maker');
    const [subText, setSubText] = useState('SEOUL, 2026');
    const [messageText, setMessageText] = useState('이곳에 당신의 소중한 순간을 기록하세요.\n깔끔한 폰트가 감성을 더해줍니다.');

    // --- UI State ---
    const [isGenerating, setIsGenerating] = useState(false);
    const [canvasScale, setCanvasScale] = useState(1);
    const containerRef = useRef(null);

    // --- External Lib ---
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    // --- Auto Scale Logic ---
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                const baseW = orientation === 'landscape' ? 600 : 400;
                const baseH = orientation === 'landscape' ? 400 : 600;

                const padding = 64;
                const scaleX = (offsetWidth - padding) / baseW;
                const scaleY = (offsetHeight - padding) / baseH;
                setCanvasScale(Math.min(Math.min(scaleX, scaleY), 1));
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        setTimeout(handleResize, 100);
        return () => window.removeEventListener('resize', handleResize);
    }, [orientation]);

    // --- Handlers ---
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = async () => {
        if (!window.html2canvas) return;
        setIsGenerating(true);
        // Slightly delay to allow UI to settle if strict mode re-renders
        await new Promise(resolve => setTimeout(resolve, 100));

        const element = document.getElementById('postcard-canvas');
        try {
            const canvas = await window.html2canvas(element, {
                scale: 4, // Increased scale for better quality
                useCORS: true,
                backgroundColor: null,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `mypostcard-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error(err);
            alert('저장 중 오류가 발생했습니다.');
        }
        setIsGenerating(false);
    };

    const getFilterStyle = () => {
        const intensity = filterIntensity / 100;
        switch (filter) {
            case 'mono': return `grayscale(${100 * intensity}%) contrast(${100 + (10 * intensity)}%)`;
            case 'warm': return `sepia(${20 * intensity}%) contrast(${100 + (5 * intensity)}%) brightness(${100 + (5 * intensity)}%) saturate(${100 + (10 * intensity)}%)`;
            case 'cool': return `hue-rotate(${180 * intensity}deg) sepia(${10 * intensity}%) contrast(100%)`;
            case 'vintage': return `sepia(${40 * intensity}%) contrast(${100 - (15 * intensity)}%) saturate(${100 - (30 * intensity)}%)`;
            case 'film': return `contrast(${100 + (15 * intensity)}%) saturate(${100 - (20 * intensity)}%) brightness(${100 + (5 * intensity)}%)`;
            default: return 'none';
        }
    };

    // --- Helper Components ---
    const SectionTitle = ({ icon: Icon, label }) => (
        <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
            <Icon size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
    );

    const ToolButton = ({ active, onClick, children }) => (
        <button
            onClick={onClick}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 border ${active
                ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
        >
            {children}
        </button>
    );

    // --- Render Templates ---
    const getDimensions = () => orientation === 'landscape'
        ? { w: 600, h: 400 }
        : { w: 400, h: 600 };

    const { w, h } = getDimensions();

    const getFontClass = () => fontStyle === 'serif' ? 'font-serif' : 'font-sans';

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] bg-[#ced4da] text-gray-800 font-sans overflow-hidden">
            {/* Styles */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Libre+Barcode+128&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Noto Sans KR', sans-serif; }
        .font-barcode { font-family: 'Libre Barcode 128', cursive; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

            {/* --- Sidebar (Controls) --- */}
            <aside className="w-full md:w-[380px] bg-white h-full z-20 flex flex-col border-r border-gray-300 shadow-2xl shadow-black/5">

                {/* Brand Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div>
                        <h1 className="text-xl font-serif font-black tracking-tight text-gray-900">My Postcard Maker</h1>
                        <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1">Capture your moment</p>
                    </div>
                    <button
                        onClick={() => {
                            setImage(null); setTitleText('My Postcard Maker'); setSubText('SEOUL, 2026');
                            setMessageText('이곳에 당신의 소중한 순간을 기록하세요.\n깔끔한 폰트가 감성을 더해줍니다.');
                            setCrop({ x: 0, y: 0 }); setZoom(1); setFilter('none'); setFilterIntensity(100);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="Reset"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                {/* Scrollable Tools */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* 1. Canvas Settings */}
                    <div>
                        <SectionTitle icon={Layout} label="Canvas Setting" />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <ToolButton active={side === 'front'} onClick={() => setSide('front')}>Front (Photo)</ToolButton>
                            <ToolButton active={side === 'back'} onClick={() => setSide('back')}>Back (Text)</ToolButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <ToolButton active={orientation === 'landscape'} onClick={() => setOrientation('landscape')}>
                                <div className="flex items-center justify-center gap-2"><AlignHorizontalSpaceAround size={14} /> Horizontal</div>
                            </ToolButton>
                            <ToolButton active={orientation === 'portrait'} onClick={() => setOrientation('portrait')}>
                                <div className="flex items-center justify-center gap-2"><AlignVerticalSpaceAround size={14} /> Vertical</div>
                            </ToolButton>
                        </div>
                    </div>

                    {/* 2. Side Specific Tools */}
                    {side === 'front' ? (
                        <>
                            <div>
                                <SectionTitle icon={ImageIcon} label="Photo Upload" />
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="p-2 bg-gray-100 rounded-full mb-2 group-hover:scale-110 transition-transform text-gray-400 group-hover:text-gray-600">
                                            <ImageIcon size={20} />
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium">Click to upload image</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>

                            {image && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <SectionTitle icon={Maximize} label="Image Adjustment" />

                                    <div className="space-y-4">
                                        {/* Zoom Slider */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                                                <div className="flex items-center gap-1"><ZoomIn size={10} /> Zoom</div>
                                                <span>{Math.round(zoom * 100)}%</span>
                                            </div>
                                            <input
                                                type="range" min="1" max="3" step="0.1"
                                                value={zoom}
                                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
                                            />
                                        </div>

                                        <p className="text-[10px] text-gray-400 mt-2">
                                            * Drag image to position (Crop)
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <SectionTitle icon={Palette} label="Filter Effect" />
                                <div className="flex gap-2 overflow-x-auto pb-2 px-1 pr-6 scrollbar-hide mb-3">
                                    {['none', 'mono', 'warm', 'cool', 'vintage', 'film'].map(f => (
                                        <button
                                            key={f} onClick={() => setFilter(f)}
                                            className={`px-4 py-2 rounded-lg text-xs capitalize font-medium transition-all whitespace-nowrap flex-shrink-0 ${filter === f ? 'bg-gray-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                {filter !== 'none' && (
                                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
                                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                                            <div className="flex items-center gap-1"><SlidersHorizontal size={10} /> Intensity</div>
                                            <span>{filterIntensity}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={filterIntensity}
                                            onChange={(e) => setFilterIntensity(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <SectionTitle icon={Layout} label="Back Template" />
                                <div className="grid grid-cols-1 gap-2">
                                    <ToolButton active={template === 'exhibition'} onClick={() => setTemplate('exhibition')}>
                                        <div className="flex justify-between items-center w-full">
                                            <span>Exhibition (Modern)</span>
                                            {template === 'exhibition' && <Check size={14} />}
                                        </div>
                                    </ToolButton>
                                    <ToolButton active={template === 'basic'} onClick={() => setTemplate('basic')}>
                                        <div className="flex justify-between items-center w-full">
                                            <span>Standard Mail (Classic)</span>
                                            {template === 'basic' && <Check size={14} />}
                                        </div>
                                    </ToolButton>
                                    <ToolButton active={template === 'blank'} onClick={() => setTemplate('blank')}>
                                        <div className="flex justify-between items-center w-full">
                                            <span>Blank (Minimal)</span>
                                            {template === 'blank' && <Check size={14} />}
                                        </div>
                                    </ToolButton>
                                </div>
                            </div>

                            {template !== 'blank' && (
                                <div>
                                    <SectionTitle icon={Type} label="Typography" />

                                    <div className="flex gap-2 mb-4">
                                        <ToolButton active={fontStyle === 'sans'} onClick={() => setFontStyle('sans')}>Gothic (Sans)</ToolButton>
                                        <ToolButton active={fontStyle === 'serif'} onClick={() => setFontStyle('serif')}>Myeongjo (Serif)</ToolButton>
                                    </div>

                                    <div className="space-y-3">
                                        <input
                                            type="text" value={titleText} onChange={(e) => setTitleText(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border-none rounded-lg text-sm font-bold focus:ring-1 focus:ring-gray-300"
                                            placeholder="Title Text"
                                        />
                                        <input
                                            type="text" value={subText} onChange={(e) => setSubText(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border-none rounded-lg text-xs font-medium focus:ring-1 focus:ring-gray-300"
                                            placeholder="Subtitle"
                                        />
                                        <textarea
                                            value={messageText} onChange={(e) => setMessageText(e.target.value)}
                                            className="w-full h-24 p-3 bg-gray-50 border-none rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-gray-300 resize-none"
                                            placeholder="Your message..."
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Accent Color</p>
                                        <div className="flex gap-3">
                                            {['#1a1a1a', '#2563eb', '#dc2626', '#059669', '#d97706'].map(c => (
                                                <button
                                                    key={c} onClick={() => setAccentColor(c)}
                                                    className={`w-6 h-6 rounded-full transition-transform ${accentColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-200' : 'hover:scale-110'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-gray-100 bg-white z-10">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200 hover:bg-black hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        {isGenerating ? 'Processing...' : <><Download size={18} /> Save Postcard</>}
                    </button>
                    <p className="text-center text-[10px] text-gray-300 mt-3 font-medium">
                        High Quality PNG Download
                    </p>
                </div>
            </aside>

            {/* --- Main Preview Area --- */}
            <main className="flex-1 relative bg-[#ced4da] flex flex-col overflow-hidden">
                {/* Desk texture effect */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

                {/* Mobile Toggle */}
                <div className="md:hidden p-4 flex justify-between items-center bg-white/50 backdrop-blur border-b border-gray-200">
                    <span className="font-serif font-bold">My Postcard</span>
                    <div className="flex gap-2">
                        <button onClick={() => setSide('front')} className={`px-3 py-1 text-xs rounded-full ${side === 'front' ? 'bg-gray-800 text-white' : 'bg-white'}`}>Front</button>
                        <button onClick={() => setSide('back')} className={`px-3 py-1 text-xs rounded-full ${side === 'back' ? 'bg-gray-800 text-white' : 'bg-white'}`}>Back</button>
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="flex-1 flex items-center justify-center p-8 relative" ref={containerRef}>
                    <div
                        className="shadow-2xl shadow-black/20 bg-white"
                        style={{
                            transform: `scale(${canvasScale})`,
                            width: w,
                            height: h,
                        }}
                    >
                        {/* Actual Capture Target */}
                        <div id="postcard-canvas" className="w-full h-full bg-white relative overflow-hidden">

                            {/* FRONT SIDE */}
                            {side === 'front' && (
                                <div className="w-full h-full bg-white relative overflow-hidden flex items-center justify-center">
                                    {/* The content area inside margin */}
                                    <div className="w-full h-full relative bg-gray-100 overflow-hidden group">
                                        {image ? (
                                            <div className="w-full h-full relative" style={{ filter: getFilterStyle() }}>
                                                <Cropper
                                                    image={image}
                                                    crop={crop}
                                                    zoom={zoom}
                                                    aspect={w / h}
                                                    onCropChange={setCrop}
                                                    onZoomChange={setZoom}
                                                    showGrid={false}
                                                    objectFit="cover" // Changed to cover for better filling
                                                    style={{
                                                        containerStyle: { background: 'transparent' },
                                                        mediaStyle: {},
                                                        cropAreaStyle: { border: 'none' } // Hide default crop border
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                <ImageIcon size={64} strokeWidth={1} />
                                                <span className="mt-4 font-serif text-sm tracking-widest uppercase">Upload your photo</span>
                                            </div>
                                        )}
                                        {/* Overlay Hint */}
                                        {image && (
                                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-2 py-1 rounded text-[10px] pointer-events-none">
                                                Drag to Crop
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* BACK SIDE */}
                            {side === 'back' && (
                                <div className="w-full h-full bg-white p-8 relative flex flex-col">
                                    {/* Template: EXHIBITION */}
                                    {template === 'exhibition' && (
                                        <div className="flex-1 flex flex-col relative h-full">
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 origin-center rotate-90 translate-x-[40%] text-[8px] text-gray-300 font-sans tracking-widest uppercase whitespace-nowrap">
                                                © MY POSTCARD MAKER 2026
                                            </div>
                                            <div className="flex justify-between items-start mb-12">
                                                <div>
                                                    <h2 className={`text-2xl font-bold tracking-tight text-gray-900 leading-none ${getFontClass()}`} style={{ color: accentColor }}>{titleText}</h2>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] mt-2">{subText}</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center px-12">
                                                <p className={`text-xs text-gray-600 leading-loose text-center whitespace-pre-wrap ${getFontClass()}`}>
                                                    {messageText}
                                                </p>
                                            </div>
                                            <div className="mt-auto pt-6 border-t-2 border-gray-900 flex justify-between items-end">
                                                <div className="flex items-center gap-2 pb-1">
                                                    <span className="text-sm font-bold">→</span>
                                                    <span className="text-[10px] font-bold tracking-widest uppercase">SEOUL</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-barcode text-4xl leading-none -mb-1 opacity-80">CODE128</span>
                                                    <span className="text-[8px] font-mono text-gray-400 tracking-wider">8 809669 735726</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Template: BASIC */}
                                    {template === 'basic' && (
                                        <div className="flex h-full gap-8">
                                            <div className="flex-1 flex flex-col justify-center pr-4">
                                                <p className={`text-xs text-gray-600 leading-[2.4] whitespace-pre-wrap ${getFontClass()}`}>
                                                    {messageText}
                                                </p>
                                            </div>
                                            <div className="w-[1px] h-[80%] my-auto bg-gray-200"></div>
                                            <div className="flex-1 flex flex-col pl-4">
                                                <div className="h-20 flex justify-end">
                                                    <div className="w-16 h-20 border border-gray-300 bg-gray-50 flex items-center justify-center">
                                                        <div className="w-12 h-16 border border-dashed border-gray-300 rounded-sm opacity-50"></div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-end gap-6 pb-8">
                                                    <div className="border-b border-gray-300 pb-1 text-right">
                                                        <span className={`text-xs font-bold ${getFontClass()}`}>{titleText}</span>
                                                    </div>
                                                    <div className="border-b border-gray-300 pb-1 text-right">
                                                        <span className={`text-[10px] text-gray-400 uppercase tracking-widest`}>{subText}</span>
                                                    </div>
                                                    <div className="border-b border-gray-300"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Template: BLANK */}
                                    {template === 'blank' && (
                                        <div className="w-full h-full flex items-end justify-center pb-4">
                                            <p className="text-[8px] text-gray-300 tracking-[0.3em] font-sans uppercase">My Postcard Maker</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PostcardMaker;
