
/**
 * Simple Arabic Number to Words Converter (Tafqit)
 * Handles integers up to millions.
 */

const ONES = [
    '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'
];

const TENS = [
    '', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'
];

const TEENS = [
    'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
];

const HUNDREDS = [
    '', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'
];

function convertGroup(n: number): string {
    if (n === 0) return '';

    if (n < 10) return ONES[n];
    if (n < 20) return TEENS[n - 10];

    if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        if (one === 0) return TENS[ten];
        return ONES[one] + ' و ' + TENS[ten];
    }

    if (n < 1000) {
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        if (remainder === 0) return HUNDREDS[hundred];
        return HUNDREDS[hundred] + ' و ' + convertGroup(remainder);
    }

    return '';
}

export function tafqit(n: number): string {
    if (n === 0) return 'صفر';

    const parts = [];

    // Billions (not implemented for simplicity, assuming reasonable qty)
    // Millions
    const millions = Math.floor(n / 1000000);
    let remainder = n % 1000000;

    if (millions > 0) {
        if (millions === 1) parts.push('مليون');
        else if (millions === 2) parts.push('مليونان');
        else if (millions >= 3 && millions <= 10) parts.push(convertGroup(millions) + ' ملايين');
        else parts.push(convertGroup(millions) + ' مليون');
    }

    // Thousands
    const thousands = Math.floor(remainder / 1000);
    remainder = remainder % 1000;

    if (thousands > 0) {
        if (thousands === 1) parts.push('ألف');
        else if (thousands === 2) parts.push('ألفان');
        else if (thousands >= 3 && thousands <= 10) parts.push(convertGroup(thousands) + ' آلاف');
        else parts.push(convertGroup(thousands) + ' ألف');
    }

    // Hundreds
    if (remainder > 0) {
        parts.push(convertGroup(remainder));
    }

    return parts.join(' و ');
}
