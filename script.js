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
    [number1Input, number2Input].forEach(input => {
        input.addEventListener('input', () => handleAutoDetection(input.id, input.nextElementSibling.id));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calculate();
        });
    });
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
function switchTab(tabId) { /* ... same as before ... */ }
function switchResultTab(tabId) { /* ... same as before ... */ }
function showSolution(problemNumber) { /* ... same as before ... */ }
// These functions are unchanged to save space, but are included in the final code block.

// ============================================
// Core Logic
// ============================================
function handleAutoDetection(inputId, baseSelectId) {
    const input = document.getElementById(inputId);
    const baseSelect = document.getElementById(baseSelectId);
    if (baseSelect.value !== 'auto') { calculate(); return; }
    let value = input.value.trim();
    if (value === '') { calculate(); return; }
    const lowerValue = value.toLowerCase();
    let detectedBase = null;
    if (/[a-f]/.test(lowerValue) || lowerValue.startsWith('0x')) detectedBase = 'hex';
    else if (lowerValue.startsWith('0b')) detectedBase = 'bin';
    else if (lowerValue.startsWith('0o')) detectedBase = 'oct'; // NEW: Handle 0o prefix
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

/**
 * NEW: Respects the manually selected base.
 */
function toDecimal(numberStr, base) {
    let number = numberStr.trim();
    if (number === '') return BigInt(0);
    let isNegative = false;
    if (number.startsWith('-')) { isNegative = true; number = number.substring(1); }

    let parsableString = number;
    // If a base is manually selected, add the required prefix if it's missing
    if (base === 'hex' && !number.toLowerCase().startsWith('0x')) parsableString = '0x' + number;
    else if (base === 'bin' && !number.toLowerCase().startsWith('0b')) parsableString = '0b' + number;
    else if (base === 'oct' && !number.toLowerCase().startsWith('0o')) parsableString = '0o' + number;

    try {
        let value = BigInt(parsableString);
        if (isNegative) value = -value;
        return value;
    } catch { throw new Error(`Invalid number format for selected base: "${numberStr}"`); }
}

function decimalToBinary(decimal, bitLength) { /* ... same as before ... */ }
function binaryToDecimal(binary) { /* ... same as before ... */ }
function getTwosComplementRange(bitLength) { /* ... same as before ... */ }

function calculate() {
    // Clear previous error messages at the start of a new calculation attempt
    if (resultContainer.querySelector('.error-message')) resultContainer.innerHTML = '';
    
    try {
        const num1Str = number1Input.value, base1 = base1Select.value;
        const num2Str = number2Input.value, base2 = base2Select.value;
        if (num1Str === '' || num2Str === '') { clearResults(); return; }
        const operation = operationSelect.value;
        const bitLength = parseInt(bitLengthSelect.value);
        const { min, max } = getTwosComplementRange(bitLength);
        
        const decimal1 = toDecimal(num1Str, base1);
        if (decimal1 < min || decimal1 > max) throw new Error(`Input ${decimal1} is out of range for ${bitLength}-bit signed numbers (${min} to ${max}).`);
        const decimal2 = toDecimal(num2Str, base2);
        if (decimal2 < min || decimal2 > max) throw new Error(`Input ${decimal2} is out of range for ${bitLength}-bit signed numbers (${min} to ${max}).`);

        const trueResult = operation === 'add' ? decimal1 + decimal2 : decimal1 - decimal2;
        const binary1 = decimalToBinary(decimal1, bitLength);
        const binary2 = decimalToBinary(decimal2, bitLength);
        const resultBigInt = (operation === 'add') ? (BigInt('0b' + binary1) + BigInt('0b' + binary2)) : (BigInt('0b' + binary1) - BigInt('0b' + binary2));
        const resultBinary = decimalToBinary(resultBigInt, bitLength);
        const resultDecimal = binaryToDecimal(resultBinary);
        const overflow = trueResult !== resultDecimal;

        displayResults(decimal1, decimal2, resultDecimal, resultBinary, operation, overflow, trueResult);
        if (showStepsCheckbox.checked) displaySteps(decimal1, decimal2, binary1, binary2, operation, resultBinary, overflow);
        else stepsContainer.innerHTML = '';
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
        overflowHTML = `<div class="overflow-display">
            <h4>Overflow Detected</h4>
            <div class="overflow-results">
                <div>
                    <span class="result-label">True Mathematical Result</span>
                    <span class="result-value">${trueResult}</span>
                </div>
                <div>
                    <span class="result-label">Wrapped (${resBin.length}-bit) Result</span>
                    <span class="result-value">${resDec}</span>
                </div>
            </div>
        </div>`;
    }
    resultContainer.innerHTML = `
        ${overflow ? '' : `<div class="result-hero"><div class="result-equation">${dec1} ${operationSymbol} ${dec2}</div><div class="result-value">${resDec}</div></div>`}
        ${overflowHTML}
        <div class="result-details">
            <div class="result-entry"><span class="result-label">Binary Representation</span><span class="result-data binary">${formatBinary(resBin)}</span></div>
            <div class="result-entry"><span class="result-label">Hexadecimal</span><span class="result-data hex">0x${(BigInt(resDec) & ((BigInt(1) << BigInt(resBin.length)) - BigInt(1))).toString(16).toUpperCase()}</span></div>
            <div class="result-entry"><span class="result-label">Octal</span><span class="result-data octal">0o${(BigInt(resDec) & ((BigInt(1) << BigInt(resBin.length)) - BigInt(1))).toString(8)}</span></div>
        </div>`;
}

function displaySteps(dec1, dec2, bin1, bin2, op, resBin, overflow) { /* ... same as before ... */ }

/**
 * NEW: Enhanced with tooltips for bit values.
 */
function displayBinaryView(bin1, bin2, resBin) {
    const createBitHTML = (binary) => {
        const bitLength = BigInt(binary.length);
        return binary.split('').map((bit, i) => {
            const position = bitLength - BigInt(1) - BigInt(i);
            const isSignBit = i === 0;
            const value = isSignBit ? -(BigInt(1) << (bitLength - BigInt(1))) : (BigInt(1) << position);
            const className = `bit ${bit === '1' ? 'one' : ''} ${isSignBit ? 'sign-bit' : ''}`;
            const title = isSignBit ? `Sign Bit (Value: ${value})` : `Bit ${position} (Value: 2^${position} = ${value})`;
            return `<span class="${className}" title="${title}">${bit}</span>`;
        }).join('');
    };
    binaryViewContainer.innerHTML = `<div class="binary-visualization"><div class="binary-line"><span class="binary-label">A</span>${createBitHTML(bin1)}</div><div class="binary-line"><span class="binary-label">${operationSelect.value === 'add' ? '+' : '−'}</span></div><div class="binary-line"><span class="binary-label">B</span>${createBitHTML(bin2)}</div><div class="binary-line separator"></div><div class="binary-line"><span class="binary-label">=</span>${createBitHTML(resBin)}</div></div>`;
}

function clearResults() { /* ... same as before ... */ }
function clearAll() { /* ... same as before ... */ }
// Full implementation of unchanged functions
function switchTab(tabId){tabButtons.forEach(b=>b.classList.toggle('active',b.dataset.tab===tabId));tabContents.forEach(c=>c.classList.toggle('active',c.id===tabId));}
function switchResultTab(tabId){resultTabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===tabId));document.querySelectorAll('.result-container, .steps-container, .binary-container').forEach(c=>c.classList.toggle('active',c.id===tabId));}
function showSolution(num){const s=document.getElementById(`solution${num}`),b=s.previousElementSibling;if(s.style.display==='block'){s.style.display='none';b.textContent='Show Solution';return}let h='';if(num===1){h=`<p><strong>Solution:</strong></p><ol><li>Positive 12 in 8-bit binary: <code>0000 1100</code></li><li>Invert the bits: <code>1111 0011</code></li><li>Add 1: <code>1111 0100</code></li></ol><p>The 8-bit two's complement of -12 is <strong>1111 0100</strong>.</p>`}else if(num===2){h=`<p><strong>Solution:</strong></p><ol><li>The first bit is 1, so it's a negative number.</li><li>Invert the bits: <code>0000 1111</code></li><li>Add 1: <code>0001 0000</code></li><li>This binary value is 16. Since it was negative, the answer is <strong>-16</strong>.</li></ol>`}s.innerHTML=h;s.style.display='block';b.textContent='Hide Solution';}
function decimalToBinary(d,bL){const m=(BigInt(1)<<BigInt(bL))-BigInt(1);return(BigInt(d)&m).toString(2).padStart(bL,'0')}
function binaryToDecimal(b){const bL=BigInt(b.length),bI=BigInt('0b'+b);if(b[0]==='1'){const m=BigInt(1)<<bL;return bI-m}return bI}
function getTwosComplementRange(bL){const b=BigInt(bL),min=-(BigInt(1)<<(b-BigInt(1))),max=(BigInt(1)<<(b-BigInt(1)))-BigInt(1);return{min,max}}
function displaySteps(d1,d2,b1,b2,op,rB,ovf){let h=`<div class="step"><div class="step-title">1. Convert Inputs to ${b1.length}-bit Two's Complement Binary</div>`;if(d1<0){const pB=decimalToBinary(BigInt(Math.abs(Number(d1))),b1.length);h+=`<p><strong>First Number (${d1}):</strong></p><ol class="conversion-steps"><li>Start with positive value <code>|${d1}|</code>: <code>${formatBinary(pB)}</code></li><li>Invert all bits: <code>${formatBinary(invertBits(pB))}</code></li><li>Add 1: <code>${formatBinary(b1)}</code></li></ol>`}else{h+=`<p>First Number <code>${d1}</code> is positive. Its binary is: <code>${formatBinary(b1)}</code></p>`}if(d2<0){const pB=decimalToBinary(BigInt(Math.abs(Number(d2))),b2.length);h+=`<p style="margin-top:1rem;"><strong>Second Number (${d2}):</strong></p><ol class="conversion-steps"><li>Start with positive value <code>|${d2}|</code>: <code>${formatBinary(invertBits(pB))}</code></li><li>Add 1: <code>${formatBinary(b2)}</code></li></ol>`}else{h+=`<p style="margin-top:1rem;">Second Number <code>${d2}</code> is positive. Its binary is: <code>${formatBinary(b2)}</code></p>`}h+=`</div>`;if(op==='add'){h+=`<div class="step"><div class="step-title">2. Perform Binary Addition</div><p>The numbers are in two's complement, so we add them directly.</p><pre>  ${formatBinary(b1)}  (${d1})\n+ ${formatBinary(b2)}  (${d2})\n${'—'.repeat(b1.length+Math.floor(b1.length/4))}\n  ${formatBinary(rB)}</pre></div>`}else{const tCB2=decimalToBinary(-d2,b2.length);h+=`<div class="step"><div class="step-title">2. Find Two's Complement of Second Number (${d2})</div><p>To subtract, we add the two's complement of the number being subtracted.</p><ol class="conversion-steps"><li>Start with binary of <code>${d2}</code>: <code>${formatBinary(b2)}</code></li><li>Invert bits: <code>${formatBinary(invertBits(b2))}</code></li><li>Add 1: <code>${formatBinary(tCB2)}</code></li></ol></div><div class="step"><div class="step-title">3. Add First Number and the Two's Complement</div><pre>  ${formatBinary(b1)}  (${d1})\n+ ${formatBinary(tCB2)}  (${-d2})\n${'—'.repeat(b1.length+Math.floor(b1.length/4))}\n  ${formatBinary(rB)}</pre></div>`}const rD=binaryToDecimal(rB);h+=`<div class="step"><div class="step-title">Final Result Interpretation</div><p>The final binary string is <code>${formatBinary(rB)}</code>.</p><p>Since the most significant bit is <code>${rB[0]}</code>, the number is <strong>${rB[0]==='1'?'negative':'positive'}</strong>.</p><p>Converting this two's complement value back to decimal gives: <strong>${rD}</strong>.</p>${ovf?`<p style="margin-top:1rem;color:var(--warning-color);"><strong>Note:</strong> An overflow occurred, which is why this result differs from the true mathematical answer.</p>`:''}</div>`;stepsContainer.innerHTML=h}
function clearResults(){resultContainer.innerHTML='';stepsContainer.innerHTML='';if(binaryViewContainer)binaryViewContainer.innerHTML='';}
function clearAll(){number1Input.value='';number2Input.value='';base1Select.value='auto';base2Select.value='auto';operationSelect.value='add';bitLengthSelect.value='16';showStepsCheckbox.checked=true;clearResults();}
