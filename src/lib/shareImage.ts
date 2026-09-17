export interface SharePoemData {
  title: string;
  body: string;
  authorName: string;
  username?: string;
  profilePic?: string;
  category?: string;
  theme?: 'royal' | 'mushaira' | 'sepia' | 'rose';
  align?: 'center' | 'left';
}

interface ThemeConfig {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  ambient1: string;
  ambient2: string;
  borderOuter: string;
  borderInner: string;
  accentGold: string;
  headerPillBg: string;
  headerPillText: string;
  titleColor: string;
  bodyColor: string;
  quoteWatermark: string;
  cardBg: string;
  cardBorder: string;
  authorNameColor: string;
  authorSubColor: string;
  footerTagline: string;
  footerUrl: string;
}

const THEMES: Record<string, ThemeConfig> = {
  royal: {
    bgStart: '#FFFDF9',
    bgMid: '#FAF3E8',
    bgEnd: '#F4E7D3',
    ambient1: 'rgba(217, 119, 6, 0.08)',
    ambient2: 'rgba(193, 106, 75, 0.09)',
    borderOuter: 'rgba(189, 142, 78, 0.45)',
    borderInner: 'rgba(189, 142, 78, 0.2)',
    accentGold: '#BD8E4E',
    headerPillBg: 'rgba(189, 142, 78, 0.12)',
    headerPillText: '#8C5A24',
    titleColor: '#2B1A11',
    bodyColor: '#38261C',
    quoteWatermark: 'rgba(193, 106, 75, 0.07)',
    cardBg: 'rgba(255, 255, 255, 0.82)',
    cardBorder: 'rgba(189, 142, 78, 0.32)',
    authorNameColor: '#2B1A11',
    authorSubColor: '#8C5A24',
    footerTagline: '#7D5C45',
    footerUrl: '#BD8E4E',
  },
  mushaira: {
    bgStart: '#0D0B12',
    bgMid: '#16121F',
    bgEnd: '#1F182B',
    ambient1: 'rgba(224, 170, 62, 0.12)',
    ambient2: 'rgba(168, 85, 247, 0.08)',
    borderOuter: 'rgba(224, 170, 62, 0.55)',
    borderInner: 'rgba(224, 170, 62, 0.22)',
    accentGold: '#E0AA3E',
    headerPillBg: 'rgba(224, 170, 62, 0.16)',
    headerPillText: '#F5D77F',
    titleColor: '#F8E9C0',
    bodyColor: '#EDE4D3',
    quoteWatermark: 'rgba(224, 170, 62, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.07)',
    cardBorder: 'rgba(224, 170, 62, 0.35)',
    authorNameColor: '#FDFBF7',
    authorSubColor: '#E0AA3E',
    footerTagline: '#B8A892',
    footerUrl: '#F5D77F',
  },
  sepia: {
    bgStart: '#F7F0E4',
    bgMid: '#EDE0CC',
    bgEnd: '#E2CEB1',
    ambient1: 'rgba(146, 94, 61, 0.08)',
    ambient2: 'rgba(180, 115, 75, 0.09)',
    borderOuter: 'rgba(146, 94, 61, 0.45)',
    borderInner: 'rgba(146, 94, 61, 0.22)',
    accentGold: '#A06742',
    headerPillBg: 'rgba(146, 94, 61, 0.12)',
    headerPillText: '#5C381E',
    titleColor: '#362013',
    bodyColor: '#452E20',
    quoteWatermark: 'rgba(146, 94, 61, 0.07)',
    cardBg: 'rgba(255, 255, 255, 0.65)',
    cardBorder: 'rgba(146, 94, 61, 0.3)',
    authorNameColor: '#362013',
    authorSubColor: '#7A4C2C',
    footerTagline: '#7A543A',
    footerUrl: '#8E5530',
  },
  rose: {
    bgStart: '#FFF9F7',
    bgMid: '#FAECE7',
    bgEnd: '#F3DBD2',
    ambient1: 'rgba(225, 29, 72, 0.07)',
    ambient2: 'rgba(193, 106, 75, 0.09)',
    borderOuter: 'rgba(205, 115, 115, 0.45)',
    borderInner: 'rgba(205, 115, 115, 0.22)',
    accentGold: '#D4736A',
    headerPillBg: 'rgba(205, 115, 115, 0.12)',
    headerPillText: '#9E3E3E',
    titleColor: '#3B181E',
    bodyColor: '#4A232A',
    quoteWatermark: 'rgba(225, 29, 72, 0.06)',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(205, 115, 115, 0.32)',
    authorNameColor: '#3B181E',
    authorSubColor: '#A84444',
    footerTagline: '#8C525B',
    footerUrl: '#C95C5C',
  },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
): string[] {
  const result: string[] = [];
  const lines = rawText.split('\n');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      result.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        result.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) {
      result.push(current);
    }
  }
  return result;
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateShareImage(data: SharePoemData): Promise<Blob | null> {
  // Ensure fonts are loaded before painting
  try {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
  } catch {
    /* ignore font load error */
  }

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const themeKey = data.theme || 'royal';
  const cfg = THEMES[themeKey] || THEMES.royal;
  const align = data.align || 'center';

  // 1. Background Gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, cfg.bgStart);
  bg.addColorStop(0.5, cfg.bgMid);
  bg.addColorStop(1, cfg.bgEnd);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Ambient Glowing Halos (Modern atmosphere)
  const g1 = ctx.createRadialGradient(W - 100, 150, 20, W - 100, 150, 420);
  g1.addColorStop(0, cfg.ambient1);
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(120, H - 240, 20, 120, H - 240, 480);
  g2.addColorStop(0, cfg.ambient2);
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // 3. Luxurious Double Borders
  const padOuter = 46;
  ctx.strokeStyle = cfg.borderOuter;
  ctx.lineWidth = 2.5;
  roundRect(ctx, padOuter, padOuter, W - padOuter * 2, H - padOuter * 2, 34);
  ctx.stroke();

  const padInner = 58;
  ctx.strokeStyle = cfg.borderInner;
  ctx.lineWidth = 1.2;
  roundRect(ctx, padInner, padInner, W - padInner * 2, H - padInner * 2, 26);
  ctx.stroke();

  // Corner Ornaments
  const drawCornerFlourish = (x: number, y: number) => {
    ctx.save();
    ctx.font = '22px serif';
    ctx.fillStyle = cfg.accentGold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', x, y);
    ctx.restore();
  };
  drawCornerFlourish(padInner + 18, padInner + 18);
  drawCornerFlourish(W - padInner - 18, padInner + 18);
  drawCornerFlourish(padInner + 18, H - padInner - 18);
  drawCornerFlourish(W - padInner - 18, H - padInner - 18);

  // 4. Header Top Pill Badge
  const headerY = padInner + 42;
  const badgeText = `✦  MEHFIL · मेहफ़िल  ✦${data.category ? `   |   ${data.category}` : ''}`;
  ctx.font = '600 20px "Cormorant Garamond", "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const badgeW = ctx.measureText(badgeText).width + 50;
  const badgeH = 42;
  const badgeX = (W - badgeW) / 2;

  ctx.fillStyle = cfg.headerPillBg;
  roundRect(ctx, badgeX, headerY - badgeH / 2, badgeW, badgeH, 21);
  ctx.fill();

  ctx.strokeStyle = cfg.cardBorder;
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, headerY - badgeH / 2, badgeW, badgeH, 21);
  ctx.stroke();

  ctx.fillStyle = cfg.headerPillText;
  ctx.fillText(badgeText, W / 2, headerY + 1);

  // 5. Giant Poetic Quotation Mark in Background
  ctx.save();
  ctx.font = 'italic 260px "Playfair Display", Georgia, serif';
  ctx.fillStyle = cfg.quoteWatermark;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('“', padInner + 30, headerY + 30);
  ctx.restore();

  // 6. Title Section
  const titleY = headerY + 70;
  const titleText = (data.title || 'बेनाम रचना').trim();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = cfg.titleColor;
  ctx.font = 'bold 44px "Rozha One", "Tiro Devanagari Hindi", "Playfair Display", serif';

  const maxContentW = W - padInner * 2 - 120;
  const titleLines = wrapLines(ctx, titleText, maxContentW);
  let currentY = titleY;

  for (const tLine of titleLines.slice(0, 2)) {
    ctx.fillText(tLine, W / 2, currentY);
    currentY += 56;
  }

  // Title Decorative Divider Rule
  currentY += 6;
  const divW = 180;
  ctx.strokeStyle = cfg.accentGold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - divW / 2, currentY);
  ctx.lineTo(W / 2 - 20, currentY);
  ctx.stroke();

  ctx.font = '16px serif';
  ctx.fillStyle = cfg.accentGold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❖', W / 2, currentY);

  ctx.beginPath();
  ctx.moveTo(W / 2 + 20, currentY);
  ctx.lineTo(W / 2 + divW / 2, currentY);
  ctx.stroke();

  currentY += 28;

  // 7. Poem Verses Layout
  const poemBody = (data.body || '').trim();
  const rawVerses = poemBody.split('\n');

  // Intelligent Font Size calculation based on line count
  let verseFontSize = 32;
  let verseLineHeight = 58;
  if (rawVerses.length <= 4) {
    verseFontSize = 36;
    verseLineHeight = 64;
  } else if (rawVerses.length <= 8) {
    verseFontSize = 30;
    verseLineHeight = 54;
  } else if (rawVerses.length <= 14) {
    verseFontSize = 26;
    verseLineHeight = 46;
  } else {
    verseFontSize = 23;
    verseLineHeight = 40;
  }

  ctx.font = `400 ${verseFontSize}px "Tiro Devanagari Hindi", "Noto Serif Devanagari", Georgia, serif`;
  ctx.fillStyle = cfg.bodyColor;

  const contentW = W - padInner * 2 - 100;
  const wrappedLines = wrapLines(ctx, poemBody, contentW);

  // Reserve space for Author Glass Card & Footer at bottom
  const reservedBottomY = H - padInner - 190;
  const availableH = reservedBottomY - currentY;
  const maxAllowedLines = Math.floor(availableH / verseLineHeight);

  // If text is short, vertically center it within available space
  const linesToRender = wrappedLines.slice(0, Math.min(wrappedLines.length, maxAllowedLines));
  const totalVersesH = linesToRender.length * verseLineHeight;
  if (totalVersesH < availableH - 60) {
    currentY += Math.floor((availableH - totalVersesH - 40) / 2);
  }

  ctx.textAlign = align === 'left' ? 'left' : 'center';
  ctx.textBaseline = 'middle';
  const textX = align === 'left' ? padInner + 70 : W / 2;

  for (let i = 0; i < linesToRender.length; i++) {
    const l = linesToRender[i];
    if (l === '') {
      currentY += verseLineHeight * 0.45;
      continue;
    }
    ctx.fillText(l, textX, currentY);
    currentY += verseLineHeight;
  }

  if (wrappedLines.length > maxAllowedLines) {
    ctx.font = `italic 22px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = cfg.accentGold;
    ctx.fillText('• • •', W / 2, currentY + 12);
  }

  // 8. Modern Glassmorphic Author Badge Card (Near Bottom)
  const cardH = 108;
  const cardW = W - padInner * 2 - 70;
  const cardX = (W - cardW) / 2;
  const cardY = H - padInner - 170;

  // Card Background with Soft Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = cfg.cardBg;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.restore();

  // Card Border
  ctx.strokeStyle = cfg.cardBorder;
  ctx.lineWidth = 1.4;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.stroke();

  // Author Avatar
  const avatarSize = 72;
  const avatarX = cardX + 22;
  const avatarY = cardY + (cardH - avatarSize) / 2;

  ctx.save();
  roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, avatarSize / 2);
  ctx.clip();

  let avatarLoaded = false;
  if (data.profilePic) {
    try {
      const img = await loadImage(data.profilePic);
      if (img) {
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        avatarLoaded = true;
      }
    } catch {
      avatarLoaded = false;
    }
  }

  if (!avatarLoaded) {
    const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    avatarGrad.addColorStop(0, cfg.accentGold);
    avatarGrad.addColorStop(1, cfg.headerPillText);
    ctx.fillStyle = avatarGrad;
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Rozha One", "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initChar = (data.authorName || 'क').trim().charAt(0).toUpperCase();
    ctx.fillText(initChar, avatarX + avatarSize / 2, avatarY + avatarSize / 2);
  }
  ctx.restore();

  // Author Avatar Double Ring
  ctx.strokeStyle = cfg.accentGold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
  ctx.stroke();

  // Author Text Info
  const authorTextX = avatarX + avatarSize + 20;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Author Name
  ctx.fillStyle = cfg.authorNameColor;
  ctx.font = 'bold 28px "Rozha One", "Cormorant Garamond", serif';
  const nameToRender = (data.authorName || 'अनाम रचनाकार').trim();
  ctx.fillText(nameToRender, authorTextX, cardY + 40);

  // Author Subtitle / Quill
  ctx.fillStyle = cfg.authorSubColor;
  ctx.font = '500 18px "Cormorant Garamond", "Noto Serif Devanagari", Georgia, serif';
  const subText = data.username ? `@${data.username}  ·  शायर` : 'रचनाकार  ·  साहित्य साधक';
  ctx.fillText(`🪶  ${subText}`, authorTextX, cardY + 72);

  // Right Side Verified/App Seal
  ctx.save();
  const sealText = '✦ मेहफ़िल';
  ctx.font = 'bold 17px "Cormorant Garamond", serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = cfg.authorSubColor;
  ctx.fillText(sealText, cardX + cardW - 24, cardY + cardH / 2);
  ctx.restore();

  // 9. Modern Minimalist Footer
  const footerY = H - padInner - 32;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = cfg.footerTagline;
  ctx.font = 'italic 17px "Tiro Devanagari Hindi", Georgia, serif';
  ctx.fillText('“जहाँ अल्फ़ाज़ एहसास बनते हैं”', W / 2, footerY - 14);

  ctx.fillStyle = cfg.footerUrl;
  ctx.font = '600 18px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('www.mehfil.in', W / 2, footerY + 12);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.96);
  });
}

export async function sharePoemImage(
  data: SharePoemData,
  fallbackUrl: string,
): Promise<{ success: boolean; method: 'share' | 'download' | 'clipboard' }> {
  const blob = await generateShareImage(data);
  if (!blob) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: data.title || 'कविता',
          text: `${(data.body || '').substring(0, 100)}\n\nwww.mehfil.in`,
          url: fallbackUrl,
        });
        return { success: true, method: 'share' };
      } catch {
        /* user cancelled */
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fallbackUrl);
      return { success: true, method: 'clipboard' };
    }
    return { success: false, method: 'clipboard' };
  }

  const cleanTitle = (data.title || 'mehfil-poem')
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]/gi, '-')
    .substring(0, 30);
  const fileName = `${cleanTitle}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  const shareText = `“${data.title || 'कविता'}”\n— ${data.authorName}\n\n${(data.body || '').substring(0, 120)}...\n\nपूरी रचना पढ़ें: ${fallbackUrl}\nसाभार: मेहफ़िल`;

  // 1. Try Native Web Share with image file
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: data.title || 'कविता — मेहफ़िल',
        text: shareText,
        files: [file],
      });
      return { success: true, method: 'share' };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: true, method: 'share' };
      }
    }
  }

  // 2. Fallback: native share with text + URL
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: data.title || 'कविता — मेहफ़िल',
        text: shareText,
        url: fallbackUrl,
      });
      return { success: true, method: 'share' };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: true, method: 'share' };
      }
    }
  }

  // 3. Last fallback: Download PNG & copy text
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${fallbackUrl}`);
    } catch {
      /* ignore */
    }
  }
  return { success: true, method: 'download' };
}
