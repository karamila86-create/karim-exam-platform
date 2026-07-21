const SYMBOLS = [
  '²', '³', '√', 'π', 'Ω', 'μ', 'Δ', '×', '÷', '±', '≤', '≥', '∞', '½', '¼', '¾',
  '₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉',
  '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹',
];

export default function SymbolToolbar({ targetRef, onInsert }) {
  function insertSymbol(sym) {
    const el = targetRef?.current;
    if (el) {
      const start = el.selectionStart ?? el.value?.length ?? 0;
      const end = el.selectionEnd ?? el.value?.length ?? 0;
      const newValue = (el.value || '').slice(0, start) + sym + (el.value || '').slice(end);
      el.value = newValue;
      const pos = start + sym.length;
      el.focus();
      el.setSelectionRange(pos, pos);
      if (onInsert) onInsert(newValue);
    } else if (onInsert) {
      onInsert(sym);
    }
  }

  return (
    <div className="symbol-toolbar">
      {SYMBOLS.map((s, i) => (
        <button
          type="button"
          key={i}
          className="symbol-btn"
          onClick={() => insertSymbol(s)}
          title={s}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
