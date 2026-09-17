import React, { useState, useEffect, useRef } from 'react';
import { generateShareImage, sharePoemImage, SharePoemData } from '@/lib/shareImage';
import { Share2, Download, Copy, Check, X, Sparkles, Moon, Sun, Feather, RefreshCw } from 'lucide-react';

interface PoemShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  poem: {
    title: string;
    body: string;
    category?: string;
    author?: any;
  } | null;
  authorName: string;
  onToast?: (msg: string) => void;
}

export const PoemShareModal: React.FC<PoemShareModalProps> = ({
  isOpen,
  onClose,
  poem,
  authorName,
  onToast,
}) => {
  const [theme, setTheme] = useState<'royal' | 'mushaira' | 'sepia' | 'rose'>('royal');
  const [align, setAlign] = useState<'center' | 'left'>('center');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blobData, setBlobData] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const previousUrlRef = useRef<string | null>(null);

  // Generate preview image whenever modal opens or settings change
  useEffect(() => {
    if (!isOpen || !poem) {
      return;
    }

    let isMounted = true;
    const createPreview = async () => {
      setIsGenerating(true);
      try {
        const data: SharePoemData = {
          title: poem.title || 'कविता',
          body: poem.body || '',
          authorName: authorName || 'रचनाकार',
          username: poem.author?.username || poem.author?.firstName,
          profilePic: poem.author?.profilePic,
          category: poem.category || 'कविता',
          theme,
          align,
        };

        const blob = await generateShareImage(data);
        if (!isMounted) return;

        if (blob) {
          setBlobData(blob);
          if (previousUrlRef.current) {
            URL.revokeObjectURL(previousUrlRef.current);
          }
          const url = URL.createObjectURL(blob);
          previousUrlRef.current = url;
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error('Error generating share preview:', err);
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    createPreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, poem, authorName, theme, align]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  if (!isOpen || !poem) return null;

  const handleDownload = () => {
    if (!blobData) return;
    const cleanTitle = (poem.title || 'mehfil-poem')
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F]/gi, '-')
      .substring(0, 30);
    const fileName = `${cleanTitle}.png`;

    const url = URL.createObjectURL(blobData);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    if (onToast) onToast('📥 HD इमेज डाउनलोड हो गई!');
  };

  const handleCopyImage = async () => {
    if (!blobData) return;
    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': blobData });
        await navigator.clipboard.write([item]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2200);
        if (onToast) onToast('📋 इमेज क्लिपबोर्ड में कॉपी हो गई!');
        return;
      }
    } catch {
      // fallback to link copy
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
      if (onToast) onToast('🔗 लिंक कॉपी हो गया!');
    } catch {
      /* ignore */
    }
  };

  const handleNativeShare = async () => {
    if (!poem) return;
    setIsSharing(true);
    try {
      const data: SharePoemData = {
        title: poem.title || 'कविता',
        body: poem.body || '',
        authorName: authorName || 'रचनाकार',
        username: poem.author?.username || poem.author?.firstName,
        profilePic: poem.author?.profilePic,
        category: poem.category || 'कविता',
        theme,
        align,
      };

      const result = await sharePoemImage(data, window.location.href);
      if (onToast) {
        if (result.method === 'share') {
          onToast('✨ साझा करें संपन्न हुआ!');
        } else if (result.method === 'download') {
          onToast('📥 इमेज डाउनलोड हो गई और लिंक कॉपी हुआ!');
        }
      }
    } catch {
      if (onToast) onToast('🔗 लिंक कॉपी हो गया!');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="modal-mask"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 12, 10, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem 0.75rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        className="modal-dialog share-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #FFFDF8 0%, #FAF3E8 100%)',
          borderRadius: '1.8rem',
          maxWidth: '520px',
          width: '100%',
          maxHeight: 'min(92dvh, 840px)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(189, 142, 78, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(45, 27, 18, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.4rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(189, 142, 78, 0.2)',
            flexShrink: 0,
            background: '#FFFDF9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(189, 142, 78, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#BD8E4E',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontFamily: '"Rozha One", "Cormorant Garamond", serif',
                  color: '#2B1A11',
                }}
              >
                आकर्षक कविता कार्ड साझा करें
              </h3>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#7D5C45' }}>
                इंस्टाग्राम, व्हाट्सएप और सोशल मीडिया के लिए आधुनिक डिज़ाइन
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="बंद करें"
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#666',
              transition: 'all 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          className="share-modal-body"
          style={{
            padding: '1.2rem 1.4rem',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            alignItems: 'center',
            flex: '1 1 auto',
            minHeight: 0,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Card Preview Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '260px',
              aspectRatio: '4 / 5',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 14px 32px -10px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(189, 142, 78, 0.2)',
              background: theme === 'mushaira' ? '#120F19' : '#FAF4EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isGenerating && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  gap: '8px',
                  zIndex: 10,
                }}
              >
                <RefreshCw size={26} className="animate-spin" />
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>कार्ड तैयार हो रहा है...</span>
              </div>
            )}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Poem Share Card Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{ color: '#888', fontSize: '0.9rem' }}>प्रतीक्षा करें...</div>
            )}
          </div>

          {/* Theme Selector */}
          <div style={{ width: '100%' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#7D5C45',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              थीम शैली चुनें
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setTheme('royal')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '12px',
                  border: theme === 'royal' ? '2px solid #BD8E4E' : '1px solid rgba(189, 142, 78, 0.25)',
                  background: theme === 'royal' ? 'rgba(189, 142, 78, 0.15)' : '#FFFDF9',
                  color: '#2B1A11',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '1rem' }}>👑</span>
                <span>शाही आइवरी</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('mushaira')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '12px',
                  border: theme === 'mushaira' ? '2px solid #E0AA3E' : '1px solid rgba(0, 0, 0, 0.15)',
                  background: theme === 'mushaira' ? '#1F182B' : '#2D243A',
                  color: '#F5D77F',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <Moon size={16} />
                <span>मुशायरा रात</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('sepia')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '12px',
                  border: theme === 'sepia' ? '2px solid #A06742' : '1px solid rgba(146, 94, 61, 0.25)',
                  background: theme === 'sepia' ? 'rgba(146, 94, 61, 0.15)' : '#EDE0CC',
                  color: '#452E20',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '1rem' }}>🍂</span>
                <span>विंटेज सेपिया</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('rose')}
                style={{
                  padding: '8px 6px',
                  borderRadius: '12px',
                  border: theme === 'rose' ? '2px solid #D4736A' : '1px solid rgba(205, 115, 115, 0.25)',
                  background: theme === 'rose' ? 'rgba(205, 115, 115, 0.15)' : '#FAECE7',
                  color: '#3B181E',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '1rem' }}>🌸</span>
                <span>गुलाबी शाम</span>
              </button>
            </div>
          </div>

          {/* Alignment Control */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(189, 142, 78, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(189, 142, 78, 0.18)',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#7D5C45', fontWeight: 500 }}>
              पंक्तियों का संरेखण (Alignment):
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setAlign('center')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: align === 'center' ? '#BD8E4E' : 'rgba(0, 0, 0, 0.06)',
                  color: align === 'center' ? '#FFF' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                मध्य (Couplet)
              </button>
              <button
                type="button"
                onClick={() => setAlign('left')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: align === 'left' ? '#BD8E4E' : 'rgba(0, 0, 0, 0.06)',
                  color: align === 'left' ? '#FFF' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                बायाँ (Left)
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(189, 142, 78, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: '#FFFDF9',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isSharing || isGenerating}
              style={{
                gridColumn: '1 / -1',
                padding: '12px 18px',
                borderRadius: '50px',
                border: 'none',
                background: 'linear-gradient(135deg, #BD8E4E 0%, #A87638 100%)',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(189, 142, 78, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Share2 size={18} />
              <span>{isSharing ? 'साझा हो रहा है...' : 'व्हाट्सएप / ऐप्स पर साझा करें'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating || !blobData}
              style={{
                padding: '10px 14px',
                borderRadius: '50px',
                border: '1px solid rgba(189, 142, 78, 0.35)',
                background: '#FFFFFF',
                color: '#2B1A11',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <Download size={16} color="#BD8E4E" />
              <span>HD इमेज डाउनलोड</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating || !blobData}
              style={{
                padding: '10px 14px',
                borderRadius: '50px',
                border: '1px solid rgba(189, 142, 78, 0.35)',
                background: '#FFFFFF',
                color: '#2B1A11',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              {isCopied ? <Check size={16} color="#16a34a" /> : <Copy size={16} color="#BD8E4E" />}
              <span>{isCopied ? 'कॉपी हो गया!' : 'इमेज कॉपी करें'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
