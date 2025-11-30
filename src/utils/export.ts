import html2canvas from 'html2canvas';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ensureFontStylesheet = (family: string) => {
    const normalized = family.replace(/['"]/g, '').trim();
    if (!normalized) return;

    const linkId = `export-font-${normalized.replace(/\s+/g, '-')}`;
    if (document.getElementById(linkId)) return;

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';

    if (normalized === 'Pretendard') {
        link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';
    } else {
        link.href = `https://fonts.googleapis.com/css2?family=${normalized.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
    }

    document.head.appendChild(link);
};

const collectFontFamilies = (element: HTMLElement): string[] => {
    const families = new Set<string>();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;

    while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent) continue;
        const fontFamily = window.getComputedStyle(parent).fontFamily;
        if (!fontFamily) continue;
        const family = fontFamily.split(',')[0].trim();
        if (family) families.add(family);
    }

    element.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.style.fontFamily) {
            const family = el.style.fontFamily.split(',')[0].trim();
            if (family) families.add(family);
        }
    });

    return Array.from(families);
};

const waitForFonts = async (families: string[]) => {
    if (!document.fonts) {
        await sleep(500);
        return;
    }

    families.forEach(ensureFontStylesheet);

    try {
        await Promise.all(
            families.map((family) => {
                const normalized = family.includes(' ') ? `"${family}"` : family;
                return document.fonts!.load(`400 16px ${normalized}`).catch(() => undefined);
            })
        );
        await document.fonts.ready;
    } catch {
        // Ignore load failures; browser will fallback.
    }

    await sleep(150);
};

const waitForImages = (element: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
        const images = Array.from(element.querySelectorAll('img'));
        if (images.length === 0) {
            resolve();
            return;
        }

        let loadedCount = 0;

        const handleComplete = () => {
            loadedCount += 1;
            if (loadedCount === images.length) {
                setTimeout(resolve, 200);
            }
        };

        images.forEach((img) => {
            if (img.complete && img.naturalWidth > 0) {
                handleComplete();
            } else {
                img.onload = handleComplete;
                img.onerror = handleComplete;
            }
        });
    });
};

// Hide selection UI and return restore function
const hideSelectionUI = (element: HTMLElement): (() => void) => {
    const modified: Array<{ el: HTMLElement; property: string; value: string }> = [];

    element.querySelectorAll<HTMLElement>('*').forEach((el) => {
        // Hide dashed borders
        if (el.style.border && el.style.border.includes('dashed')) {
            modified.push({ el, property: 'border', value: el.style.border });
            el.style.border = '1px dashed transparent';
        }

        // Hide resize handles (green bars)
        const background = el.style.background || el.style.backgroundColor;
        if (background && background.includes('rgb(76, 175, 80)')) {
            modified.push({ el, property: 'display', value: el.style.display });
            el.style.display = 'none';
        }
    });

    // Return restore function
    return () => {
        modified.forEach(({ el, property, value }) => {
            (el.style as any)[property] = value;
        });
    };
};

export const exportToImage = async (elementId: string, format: 'png' | 'jpeg' = 'png', fileName?: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found:', elementId);
        alert('내보낼 요소를 찾을 수 없습니다.');
        return;
    }

    // Hide selection UI before capture
    const restoreUI = hideSelectionUI(element);

    try {
        // Wait for fonts
        const families = collectFontFamilies(element);
        await waitForFonts(families);

        // Wait for images
        await waitForImages(element);

        // Additional wait for rendering
        await sleep(100);

        const rect = element.getBoundingClientRect();
        const scale = 4; // High resolution (approximately 300 DPI)

        // Use html2canvas to capture the element directly
        const canvas = await html2canvas(element, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: rect.width,
            height: rect.height,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            windowWidth: rect.width,
            windowHeight: rect.height,
        });

        // Convert canvas to data URL
        const dataUrl = format === 'png' 
            ? canvas.toDataURL('image/png', 1.0)
            : canvas.toDataURL('image/jpeg', 0.95);

        // Download the image
        const link = document.createElement('a');
        link.download = fileName || `design.${format === 'jpeg' ? 'jpg' : 'png'}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Export failed:', error);
        alert(`내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
        // Always restore UI
        restoreUI();
    }
};
