// ============================================
// Global Variables and DOM Elements
// ============================================
let number1Input, number2Input, base1Select, base2Select, operationSelect;
let calculateBtn, clearBtn, bitLengthSelect, showStepsCheckbox;
let resultContainer, stepsContainer, binaryViewContainer;
let tabContents, tabButtons, resultTabs;

// ============================================
// Application Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    number1Input = document.getElementById('number1');
    number2Input = document.getElementById('number2');
    base1Select = document.getElementById('base1');
    base2Select = document.getElementById('base2');
    operationSelect = document.getElementById('operation');
    calculateBtn = document.getElementById('calculate');
    clearBtn = document.getElementById('clear');
    bitLengthSelect = document.getElementById('bitLength');
    showStepsCheckbox = document.getElementById('showSteps');
    resultContainer = document.getElementById('result');
    stepsContainer = document.getElementById('steps');
    binaryViewContainer = document.getElementById('binary'); 
    tabContents = document.querySelectorAll('.tab-content');
    tabButtons = document.querySelectorAll('.tab-button');
    resultTabs = document.querySelectorAll('.result-tab');
    
    setupEventListeners();
    switchTab('calculator');
});

function setupEventListeners() {
    number1Input.addEventListener('input', () => handleAutoDetection('number1', 'base1'));
    number2Input.addEventListener('input', () => handleAutoDetection('number2', 'base2'));
    base1Select.addEventListener('change', calculate);
    base2Select.addEventListener('change', calculate);
    tabButtons.forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    resultTabs.forEach(tab => tab.addEventListener('click', () => switchResultTab(tab.dataset.tab)));
    calculateBtn.addEventListener('click', calculate);
    clearBtn.addEventListener('click', clearAll);
    showStepsCheckbox.addEventListener('change', calculate);
    operationSelect.addEventListener('change', calculate);
    bitLengthSelect.addEventListener('change', calculate);
}

// ============================================
// UI Functions
// ============================================
function switchTab(tabId) {
    tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === tabId));
    tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
}

function switchResultTab(tabId) {
    resultTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
    document.querySelectorAll('.result-container, .steps-container, .binary-container').forEach(container => {
        container.classList.toggle('active', container.id === tabId);
    });
}

function showSolution(problemNumber) {
    const solution = document.getElementById(`solution${problemNumber}`);
    const button = solution.previousElementSibling;
    if (solution.style.display === 'block') {
        solution.style.display = 'none'; button.textContent = 'Show Solution'; return;
    }
    let solutionHTML = '';
    if (problemNumber === 1) { // -12
        solutionHTML = `<p><strong>Solution:</strong></p><ol><li>Positive 12 in 8-bit binary: <code>0000 1100</code></li><li>Invert the bits: <code>1111 0011</code></li><li>Add 1: <code>1111 0100</code></li></ol><p>The 8-bit two's complement of -12 is <strong>1111 0100</strong>.</p>`;
    } else if (problemNumber === 2) { // 1111 0000
        solutionHTML = `<p><strong>Solution:</strong></p><ol><li>The first bit is 1, so it's a negative number.</li><li>Invert the bits: <code>0000 1111</code></li><li>Add 1: <code>0001 0000</code></li><li>This binary value is 16. Since it was negative, the answer is <strong>-16</strong>.</li></ol>`;
    }
    solution.innerHTML = solutionHTML; solution.style.display = 'block'; button.textContent = 'Hide Solution';
}

// ============================================
// Core Logic
// ============================================
function handleAutoDetection(inputId, baseSelectId) {
    const input = document.getElementById(inputId);
    const baseSelect = document.getElementById(baseSelectId);
    if (baseSelect.value !== 'auto') { calculate(); return; } // Recalculate if user changes format manually
    let value = input.value.trim();
    if (value === '') { calculate(); return; }
    const lowerValue = value.toLowerCase();
    let detectedBase = null;
    if (/[a-f]/.test(lowerValue) || lowerValue.startsWith('0x')) detectedBase = 'hex';
    else if (lowerValue.startsWith('0b')) detectedBase = 'bin';
    else if (lowerValue.startsWith('0') && value.length > 1 && /^[0-7]+$/.test(value)) detectedBase = 'oct';
    else if (/^[01]+$/.test(value) && value.length > 1) detectedBase = 'bin';
    else if (/^-?\d+$/.test(value)) detectedBase = 'dec';
    let formattedValue = value;
    if (detectedBase === 'hex' && !lowerValue.startsWith('0x')) formattedValue = (value.startsWith('-') ? '-0x' : '0x') + value.replace(/^-/, '');
    else if (detectedBase === 'bin' && !lowerValue.startsWith('0b')) formattedValue = (value.startsWith('-') ? '-0b' : '0b') + value.replace(/^-/, '');
    if (input.value !== formattedValue) {
        const start = input.selectionStart;
        input.value = formattedValue;
        input.selectionStart = input.selectionEnd = start + (formattedValue.length - value.length);
    }
    calculate();
}

function toDecimal(numberStr) {
    const number = numberStr.trim();
    if (number === '') return BigInt(0);
    let isNegative = false, parsableString = number;
    if (number.startsWith('-')) { isNegative = true; parsableString = number.substring(1); }
    try {
        let value = BigInt(parsableString);
        if (isNegative) value = -value;
        return value;
    } catch { throw new Error(`Invalid number format: "${numberStr}"`); }
}

function decimalToBinary(decimal, bitLength) {
    const mask = (BigInt(1) << BigInt(bitLength)) - BigInt(1);
    return (BigInt(decimal) & mask).toString(2).padStart(bitLength, '0');
}

function binaryToDecimal(binary) {
    const bitLength = BigInt(binary.length);
    const binBigInt = BigInt('0b' + binary);
    if (binary[0] === '1') {
        const mask = BigInt(1) << bitLength;
        return binBigInt - mask;
    }
    return binBigInt;
}

function getTwosComplementRange(bitLength) {
    const bits = BigInt(bitLength);
    const min = -(BigInt(1) << (bits - BigInt(1)));
    const max = (BigInt(1) << (bits - BigInt(1))) - BigInt(1);
    return { min, max };
}

function calculate() {
    try {
        const num1Str = number1Input.value, num2Str = number2Input.value;
        if (num1Str === '' || num2Str === '') { clearResults(); return; }
        const operation = operationSelect.value;
        const bitLength = parseInt(bitLengthSelect.value);
        const { min, max } = getTwosComplementRange(bitLength);
        const decimal1 = toDecimal(num1Str);
        if (decimal1 < min || decimal1 > max) throw new Error(`Input ${decimal1} is out of range for ${bitLength}-bit signed numbers (${min} to ${max}).`);
        const decimal2 = toDecimal(num2Str);
        if (decimal2 < min || decimal2 > max) throw new Error(`Input ${decimal2} is out of range for ${bitLength}-bit signed numbers (${min} to ${max}).`);
        const trueResult = operation === 'add' ? decimal1 + decimal2 : decimal1 - decimal2;
        const binary1 = decimalToBinary(decimal1, bitLength);
        const binary2 = decimalToBinary(decimal2, bitLength);
        const resultBigInt = (operation === 'add') ? (BigInt('0b' + binary1) + BigInt('0b' + binary2)) : (BigInt('0b' + binary1) - BigInt('0b' + binary2));
        const resultBinary = decimalToBinary(resultBigInt, bitLength);
        const resultDecimal = binaryToDecimal(resultBinary);
        const overflow = trueResult !== resultDecimal;
        displayResults(decimal1, decimal2, resultDecimal, resultBinary, operation, overflow, trueResult);
        if (showStepsCheckbox.checked) {
            displaySteps(decimal1, decimal2, binary1, binary2, operation, resultBinary, overflow);
        } else {
            stepsContainer.innerHTML = '';
        }
        displayBinaryView(binary1, binary2, resultBinary);
    } catch (error) {
        resultContainer.innerHTML = `<div class="error-message">❌ ${error.message}</div>`;
        stepsContainer.innerHTML = '';
        if(binaryViewContainer) binaryViewContainer.innerHTML = '';
    }
}

// ============================================
// Helper & Display Functions
// ============================================
const invertBits = (bin) => bin.split('').map(b => b === '1' ? '0' : '1').join('');
const formatBinary = (binary) => binary.replace(/(.{4})/g, '$1 ').trim();

function displayResults(dec1, dec2, resDec, resBin, op, overflow, trueResult) {
    const operationSymbol = op === 'add' ? '+' : '−';
    let overflowHTML = '';
    if (overflow) {
        overflowHTML = `<div class="overflow-warning"><strong>Overflow Detected!</strong> The true result (${trueResult}) is outside the ${resBin.length}-bit range. The result has wrapped around.</div>`;
    }
    resultContainer.innerHTML = `<div class="result-hero"><div class="result-equation">${dec1} ${operationSymbol} ${dec2}</div><div class="result-value">${resDec}</div></div>${overflowHTML}<div class="result-details"><div class="result-entry"><span class="result-label">Binary (${resBin.length}-bit)</span><span class="result-data binary">${formatBinary(resBin)}</span></div><div class="result-entry"><span class="result-label">Hexadecimal</span><span class="result-data hex">0x${(BigInt(resDec) & ((BigInt(1) << BigInt(resBin.length)) - BigInt(1))).toString(16).toUpperCase()}</span></div><div class="result-entry"><span class="result-label">Octal</span><span class="result-data octal">0${(BigInt(resDec) & ((BigInt(1) << BigInt(resBin.length)) - BigInt(1))).toString(8)}</span></div></div>`;
}

function displaySteps(dec1, dec2, bin1, bin2, op, resBin, overflow) {
    let stepsHTML = `<div class="step"><div class="step-title">1. Convert Inputs to ${bin1.length}-bit Two's Complement Binary</div>`;
    if (dec1 < 0) { const posBin = decimalToBinary(BigInt(Math.abs(Number(dec1))), bin1.length); stepsHTML += `<p><strong>First Number (${dec1}):</strong></p><ol class="conversion-steps"><li>Start with positive value <code>|${dec1}|</code>: <code>${formatBinary(posBin)}</code></li><li>Invert all bits (One's Complement): <code>${formatBinary(invertBits(posBin))}</code></li><li>Add 1 to get Two's Complement: <code>${formatBinary(bin1)}</code></li></ol>`; } 
    else { stepsHTML += `<p>First Number <code>${dec1}</code> is positive. Its binary is: <code>${formatBinary(bin1)}</code></p>`; }
    if (dec2 < 0) { const posBin = decimalToBinary(BigInt(Math.abs(Number(dec2))), bin2.length); stepsHTML += `<p style="margin-top:1rem;"><strong>Second Number (${dec2}):</strong></p><ol class="conversion-steps"><li>Start with positive value <code>|${dec2}|</code>: <code>${formatBinary(posBin)}</code></li><li>Invert all bits (One's Complement): <code>${formatBinary(invertBits(posBin))}</code></li><li>Add 1 to get Two's Complement: <code>${formatBinary(bin2)}</code></li></ol>`; } 
    else { stepsHTML += `<p style="margin-top:1rem;">Second Number <code>${dec2}</code> is positive. Its binary is: <code>${formatBinary(bin2)}</code></p>`; }
    stepsHTML += `</div>`;
    if (op === 'add') { stepsHTML += `<div class="step"><div class="step-title">2. Perform Binary Addition</div><p>The numbers are in two's complement, so we add them directly.</p><pre>  ${formatBinary(bin1)}  (${dec1})\n+ ${formatBinary(bin2)}  (${dec2})\n${'—'.repeat(bin1.length + Math.floor(bin1.length / 4))}\n  ${formatBinary(resBin)}</pre></div>`; } 
    else { const twosCompOfBin2 = decimalToBinary(-dec2, bin2.length); stepsHTML += `<div class="step"><div class="step-title">2. Find Two's Complement of Second Number (${dec2})</div><p>To subtract, we add the two's complement of the number being subtracted.</p><ol class="conversion-steps"><li>Start with binary of <code>${dec2}</code>: <code>${formatBinary(bin2)}</code></li><li>Invert bits: <code>${formatBinary(invertBits(bin2))}</code></li><li>Add 1: <code>${formatBinary(twosCompOfBin2)}</code></li></ol></div><div class="step"><div class="step-title">3. Add First Number and the Two's Complement</div><pre>  ${formatBinary(bin1)}  (${dec1})\n+ ${formatBinary(twosCompOfBin2)}  (-${dec2})\n${'—'.repeat(bin1.length + Math.floor(bin1.length / 4))}\n  ${formatBinary(resBin)}</pre></div>`; }
    
    // *** THIS IS THE CORRECTED LINE ***
    const resultDecimal = binaryToDecimal(resBin); 
    
    stepsHTML += `<div class="step"><div class="step-title">Final Result Interpretation</div><p>The final binary string is <code>${formatBinary(resBin)}</code>.</p><p>Since the most significant bit is <code>${resBin[0]}</code>, the number is <strong>${resBin[0] === '1' ? 'negative' : 'positive'}</strong>.</p><p>Converting this two's complement value back to decimal gives: <strong>${resultDecimal}</strong>.</p>${overflow ? `<p style="margin-top:1rem;color:var(--warning-color);"><strong>Note:</strong> An overflow occurred, which is why this result differs from the true mathematical answer.</p>` : ''}</div>`;
    stepsContainer.innerHTML = stepsHTML;
}

function displayBinaryView(bin1, bin2, resBin) {
    const createBitHTML = (binary) => binary.split('').map((bit, i) => `<span class="bit ${bit === '1' ? 'one' : ''} ${i === 0 ? 'sign-bit' : ''}" title="${i === 0 ? 'Sign Bit' : `Bit ${binary.length - 1 - i}`}">${bit}</span>`).join('');
    binaryViewContainer.innerHTML = `<div class="binary-visualization"><div class="binary-line"><span class="binary-label">A</span>${createBitHTML(bin1)}</div><div class="binary-line"><span class="binary-label">${operationSelect.value === 'add' ? '+' : '−'}</span></div><div class="binary-line"><span class="binary-label">B</span>${createBitHTML(bin2)}</div><div class="binary-line separator"></div><div class="binary-line"><span class="binary-label">=</span>${createBitHTML(resBin)}</div></div>`;
}

function clearResults() { resultContainer.innerHTML = ''; stepsContainer.innerHTML = ''; if(binaryViewContainer) binaryViewContainer.innerHTML = ''; }
function clearAll() { number1Input.value = ''; number2Input.value = ''; base1Select.value = 'auto'; base2Select.value = 'auto'; operationSelect.value = 'add'; bitLengthSelect.value = '16'; showStepsCheckbox.checked = true; clearResults(); }
