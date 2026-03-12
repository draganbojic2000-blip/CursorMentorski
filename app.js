(function () {
  const STORAGE_KEY = 'licne-finansije-transakcije';
  const CURRENCY_KEY = 'licne-finansije-valuta';

  const form = document.getElementById('form-transakcija');
  const tipSelect = document.getElementById('tip');
  const iznosInput = document.getElementById('iznos');
  const datumInput = document.getElementById('datum');
  const kategorijaInput = document.getElementById('kategorija');
  const opisInput = document.getElementById('opis');
  const filterMesec = document.getElementById('filter-mesec');
  const filterGodina = document.getElementById('filter-godina');
  const viewMode = document.getElementById('view-mode');
  const filterDatum = document.getElementById('filter-datum');
  const labelFilterDan = document.getElementById('label-filter-dan');
  const valutaSelect = document.getElementById('valuta');
  const ukupnoPrihodiEl = document.getElementById('ukupno-prihodi');
  const ukupnoRashodiEl = document.getElementById('ukupno-rashodi');
  const bilansEl = document.getElementById('bilans');
  const listaTransakcija = document.getElementById('lista-transakcija');
  const praznoPoruka = document.getElementById('prazno-poruka');
  const btnIzvezi = document.getElementById('btn-izvezi');

  const MESIOCI = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

  function getTransakcije() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setTransakcije(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function getValuta() {
    return valutaSelect?.value || 'RSD';
  }

  function ucitajValutu() {
    try {
      const saved = localStorage.getItem(CURRENCY_KEY);
      if (saved && valutaSelect) {
        valutaSelect.value = saved;
      }
    } catch {
      // ignore
    }
  }

  function sacuvajValutu() {
    try {
      localStorage.setItem(CURRENCY_KEY, getValuta());
    } catch {
      // ignore
    }
  }

  function postaviDanasnjiDatum() {
    const today = new Date().toISOString().slice(0, 10);
    if (!datumInput.value) datumInput.value = today;
    if (filterDatum && !filterDatum.value) filterDatum.value = today;
  }

  function popuniFilterGodina() {
    const transakcije = getTransakcije();
    const godine = new Set();
    const danas = new Date();
    godine.add(danas.getFullYear());
    transakcije.forEach(t => {
      const d = new Date(t.datum);
      if (!isNaN(d.getTime())) godine.add(d.getFullYear());
    });
    const sortirane = [...godine].sort((a, b) => b - a);
    filterGodina.innerHTML = sortirane.map(g => `<option value="${g}">${g}</option>`).join('');
    if (sortirane.length && !filterGodina.value) filterGodina.value = danas.getFullYear();
  }

  function popuniFilterMesec() {
    filterMesec.innerHTML = '<option value="">Svi mesioci</option>' +
      MESIOCI.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
    const danas = new Date();
    if (!filterMesec.value) filterMesec.value = (danas.getMonth() + 1).toString();
  }

  function filtriraneTransakcije() {
    const sve = getTransakcije();
    const mode = viewMode.value;
    const godina = parseInt(filterGodina.value, 10);
    const mesec = filterMesec.value ? parseInt(filterMesec.value, 10) : null;
    const datumFilter = filterDatum?.value || null;

    return sve.filter(t => {
      const d = new Date(t.datum);
      if (isNaN(d.getTime())) return false;

      if (mode === 'godina') {
        return d.getFullYear() === godina;
      }

      if (mode === 'mesec') {
        if (!mesec) return d.getFullYear() === godina;
        return d.getFullYear() === godina && d.getMonth() + 1 === mesec;
      }

      if (mode === 'dan') {
        if (!datumFilter) return false;
        return t.datum === datumFilter;
      }

      return true;
    });
  }

  function izracunajRezime(transakcije) {
    let prihodi = 0, rashodi = 0;
    transakcije.forEach(t => {
      const iznos = parseFloat(t.iznos) || 0;
      if (t.tip === 'prihod') prihodi += iznos;
      else rashodi += iznos;
    });
    return { prihodi, rashodi, bilans: prihodi - rashodi };
  }

  function formatirajBrojCSV(x) {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(x);
  }

  // Locale 407 = nemački (tačka hiljade, zarez decimale) – isto kao u Format Cells uzoru
  const EXCEL_DATUM_FORMAT = '[$-407]dd.mm.yyyy';
  const EXCEL_BROJ_FORMAT = '[$-407]#.##0,00';
  const SIVA_POZADINA = 'FFE5E5E5';
  const SIVA_ZAGLAVLJE = 'FFD0D0D0';
  const TANKA_LINIJA = { style: 'thin' };
  const EXCEL_BOJA_PRIHOD = 'FF2E7D32';
  const EXCEL_BOJA_RASHOD = 'FFC62828';
  const EXCEL_BOJA_SALDO = 'FF1565C0';

  function formatirajIznos(x) {
    const valuta = getValuta();
    return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(x) + ' ' + valuta;
  }

  function formatirajDatum(str) {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function osveziRezime() {
    const transakcije = filtriraneTransakcije();
    const { prihodi, rashodi, bilans } = izracunajRezime(transakcije);

    ukupnoPrihodiEl.textContent = formatirajIznos(prihodi);
    ukupnoRashodiEl.textContent = formatirajIznos(rashodi);
    bilansEl.textContent = formatirajIznos(bilans);
    bilansEl.classList.remove('pozitivno', 'negativno');
    if (bilans > 0) bilansEl.classList.add('pozitivno');
    else if (bilans < 0) bilansEl.classList.add('negativno');
  }

  function obrisiTransakciju(id) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu transakciju?')) return;
    const sve = getTransakcije().filter(t => t.id !== id);
    setTransakcije(sve);
    crtajListu();
    osveziRezime();
    popuniFilterGodina();
  }

  function crtajListu() {
    const transakcije = filtriraneTransakcije().sort((a, b) => new Date(b.datum) - new Date(a.datum));

    if (transakcije.length === 0) {
      listaTransakcija.innerHTML = '';
      praznoPoruka.classList.remove('sakriveno');
      return;
    }
    praznoPoruka.classList.add('sakriveno');

    listaTransakcija.innerHTML = transakcije.map(t => {
      const isPrihod = t.tip === 'prihod';
      const tekst = [t.kategorija, t.opis].filter(Boolean).join(' — ') || 'Bez opisa';
      return `
        <li data-id="${t.id}">
          <div class="info">
            <span class="datum-str">${formatirajDatum(t.datum)}</span>
            <span class="kategorija-opis">${escapeHtml(tekst)}</span>
          </div>
          <div class="iznos ${t.tip}">${isPrihod ? '+' : '-'} ${formatirajIznos(parseFloat(t.iznos))}</div>
          <div class="akcije">
            <button type="button" class="obrisi" title="Obriši" aria-label="Obriši">🗑</button>
          </div>
        </li>
      `;
    }).join('');

    listaTransakcija.querySelectorAll('.obrisi').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.closest('li').dataset.id;
        if (id) obrisiTransakciju(id);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function osveziPrikaz() {
    osveziRezime();
    crtajListu();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const transakcije = getTransakcije();
    const trenutniRezime = izracunajRezime(transakcije);
    const trenutniBilans = trenutniRezime.bilans;

    const iznosUnosa = parseFloat(iznosInput.value) || 0;
    if (tipSelect.value === 'rashod' && iznosUnosa > trenutniBilans) {
      alert('Ne možete uneti rashod veći od trenutnog salda. Prvo unesite prihod.');
      return;
    }

    const id = String(Date.now());
    const nova = {
      id,
      tip: tipSelect.value,
      iznos: iznosUnosa,
      datum: datumInput.value,
      kategorija: (kategorijaInput.value || '').trim(),
      opis: (opisInput.value || '').trim()
    };
    transakcije.push(nova);
    setTransakcije(transakcije);

    form.reset();
    postaviDanasnjiDatum();
    popuniFilterGodina();
    if (viewMode.value === 'mesec') {
      const d = new Date(nova.datum);
      filterMesec.value = (d.getMonth() + 1).toString();
      filterGodina.value = d.getFullYear().toString();
    }
    osveziPrikaz();
  });

  filterMesec.addEventListener('change', osveziPrikaz);
  filterGodina.addEventListener('change', osveziPrikaz);
  viewMode.addEventListener('change', function () {
    const mode = viewMode.value;
    if (mode === 'godina') {
      filterMesec.value = '';
      if (labelFilterDan) labelFilterDan.classList.remove('active');
    } else if (mode === 'mesec') {
      const d = new Date();
      filterMesec.value = (d.getMonth() + 1).toString();
      if (labelFilterDan) labelFilterDan.classList.remove('active');
    } else if (mode === 'dan') {
      const today = new Date().toISOString().slice(0, 10);
      if (filterDatum && !filterDatum.value) filterDatum.value = today;
      if (labelFilterDan) labelFilterDan.classList.add('active');
    }
    osveziPrikaz();
  });

  if (valutaSelect) {
    valutaSelect.addEventListener('change', function () {
      sacuvajValutu();
      osveziPrikaz();
    });
  }

  const kategorijaSelect = document.getElementById('kategorija');
  if (kategorijaSelect && tipSelect) {
    kategorijaSelect.addEventListener('change', function () {
      const kategorija = (this.value || '').trim();
      if (kategorija === 'Plata' || kategorija === 'Akontacija') {
        tipSelect.value = 'prihod';
      } else if (kategorija) {
        tipSelect.value = 'rashod';
      }
    });
  }

  btnIzvezi.addEventListener('click', async function () {
    const transakcije = filtriraneTransakcije().sort((a, b) => new Date(a.datum) - new Date(b.datum));
    if (transakcije.length === 0) {
      alert('Nema transakcija za izvoz.');
      return;
    }
    if (typeof ExcelJS === 'undefined') {
      alert('Excel izvoz trenutno nije dostupan (ExcelJS biblioteka nije učitana).');
      return;
    }

    const valuta = getValuta();
    const mode = viewMode.value;
    let periodOpis = '';
    if (mode === 'godina') periodOpis = filterGodina.value || '';
    else if (mode === 'mesec') periodOpis = `${filterGodina.value || ''}-${filterMesec.value || ''}`;
    else if (mode === 'dan') periodOpis = filterDatum?.value || '';

    const rezime = izracunajRezime(transakcije);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Finansije', { views: [{ rightToLeft: false }] });

    const periodTip = mode === 'dan' ? 'Dnevni' : (mode === 'mesec' ? 'Mesečni' : 'Godišnji');
    const periodZaglavlje = periodTip + (periodOpis ? ' — ' + periodOpis : '');

    ws.getCell(1, 1).value = 'Lične finansije Dragan';
    ws.getCell(2, 1).value = 'Period';
    ws.getCell(2, 2).value = periodZaglavlje || 'Svi zapisi';
    ws.getCell(3, 1).value = 'Valuta';
    ws.getCell(3, 2).value = valuta;

    ws.getCell(1, 1).font = Object.assign({}, ws.getCell(1, 1).font || {}, { bold: true });
    ws.getCell(2, 1).font = Object.assign({}, ws.getCell(2, 1).font || {}, { bold: true });
    ws.getCell(2, 2).font = Object.assign({}, ws.getCell(2, 2).font || {}, { bold: true });
    ws.getCell(3, 1).font = Object.assign({}, ws.getCell(3, 1).font || {}, { bold: true });
    ws.getCell(3, 2).font = Object.assign({}, ws.getCell(3, 2).font || {}, { bold: true });

    const headerRow = 5;
    ws.getCell(headerRow, 1).value = 'Datum';
    ws.getCell(headerRow, 2).value = 'Kategorija';
    ws.getCell(headerRow, 3).value = 'Opis';
    ws.getCell(headerRow, 4).value = 'Prihod';
    ws.getCell(headerRow, 5).value = 'Rashod';
    ws.getCell(headerRow, 6).value = 'Saldo';

    let tekućiSaldo = 0;
    let dataRow = headerRow + 1;
    transakcije.forEach(t => {
      const iznos = parseFloat(t.iznos) || 0;
      let prihod = null;
      let rashod = null;
      if (t.tip === 'prihod') {
        prihod = iznos;
        tekućiSaldo += iznos;
      } else {
        rashod = iznos;
        tekućiSaldo -= iznos;
      }

      // Datum kao gotov tekst u formatu dd.mm.yyyy
      ws.getCell(dataRow, 1).value = formatirajDatum(t.datum);

      ws.getCell(dataRow, 2).value = t.kategorija || '';
      ws.getCell(dataRow, 3).value = t.opis || '';

      // Iznosi kao tekst u formatu #.##0,00
      ws.getCell(dataRow, 4).value = prihod !== null ? formatirajBrojCSV(prihod) : '';
      ws.getCell(dataRow, 5).value = rashod !== null ? formatirajBrojCSV(rashod) : '';
      ws.getCell(dataRow, 6).value = formatirajBrojCSV(tekućiSaldo);

      dataRow++;
    });

    const rezimeRow = dataRow + 1;
    ws.getCell(rezimeRow, 3).value = 'Ukupan bilans';
    ws.getCell(rezimeRow, 6).value = formatirajBrojCSV(rezime.bilans);

    const lastRow = rezimeRow;
    const lastCol = 6;

    // Širine kolona da se svi podaci vide u punom obliku
    ws.getColumn(1).width = 14;  // Datum (dd.mm.yyyy.)
    ws.getColumn(2).width = 18;  // Kategorija
    ws.getColumn(3).width = 28;  // Opis
    ws.getColumn(4).width = 14;  // Prihod
    ws.getColumn(5).width = 14;  // Rashod
    ws.getColumn(6).width = 14;  // Saldo

    for (let r = headerRow; r <= lastRow; r++) {
      const isSiviRed = r > headerRow && (r - headerRow) % 2 === 0;
      for (let c = 1; c <= lastCol; c++) {
        const cell = ws.getCell(r, c);
        cell.border = {
          top: TANKA_LINIJA,
          left: TANKA_LINIJA,
          bottom: TANKA_LINIJA,
          right: TANKA_LINIJA
        };

        // Poravnanje: naslovna linija sve centrirano; datum centriran, iznosi desno
        if (r === headerRow) {
          cell.alignment = Object.assign({}, cell.alignment || {}, { horizontal: 'center' });
        } else if (c === 1) {
          cell.alignment = Object.assign({}, cell.alignment || {}, { horizontal: 'center' });
        } else if (c === 4 || c === 5 || c === 6) {
          cell.alignment = Object.assign({}, cell.alignment || {}, { horizontal: 'right' });
        }

        // Zaglavlje bold, svetlo siva pozadina (tamnija od redova u tabeli); naslovi Prihod, Rashod, Saldo crni
        if (r === headerRow) {
          cell.font = Object.assign({}, cell.font || {}, { bold: true });
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIVA_ZAGLAVLJE } };
          if (c === 4 || c === 5 || c === 6) {
            cell.font = Object.assign({}, cell.font || {}, { color: { argb: 'FF000000' } });
          }
        }

        // Boje iznosa (samo podaci, ne zaglavlje): prihod zelena, rashod crvena, saldo tamno plava (bez bold)
        if (r !== headerRow) {
          if (c === 4) {
            cell.font = Object.assign({}, cell.font || {}, { color: { argb: EXCEL_BOJA_PRIHOD } });
          } else if (c === 5) {
            cell.font = Object.assign({}, cell.font || {}, { color: { argb: EXCEL_BOJA_RASHOD } });
          } else if (c === 6) {
            cell.font = Object.assign({}, cell.font || {}, { color: { argb: EXCEL_BOJA_SALDO } });
          }
        }

        // Iznos ukupnog salda (red „Ukupan bilans”, kolona Saldo) — bold
        if (r === rezimeRow && c === 6) {
          cell.font = Object.assign({}, cell.font || {}, { bold: true });
        }

        // Svaki drugi red blago sivi
        if (isSiviRed) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SIVA_POZADINA } };
        }
      }
    }

    try {
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `finansije-${filterGodina.value || 'sve'}${filterMesec.value ? '-' + filterMesec.value : ''}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert('Greška pri izvozu u Excel: ' + (err && err.message ? err.message : 'nepoznato'));
    }
  });

  // Inicijalizacija
  postaviDanasnjiDatum();
  ucitajValutu();
  popuniFilterMesec();
  popuniFilterGodina();
  osveziPrikaz();
})();


