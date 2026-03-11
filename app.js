(function () {
  const STORAGE_KEY = 'licne-finansije-transakcije';

  const form = document.getElementById('form-transakcija');
  const tipSelect = document.getElementById('tip');
  const iznosInput = document.getElementById('iznos');
  const datumInput = document.getElementById('datum');
  const kategorijaInput = document.getElementById('kategorija');
  const opisInput = document.getElementById('opis');
  const filterMesec = document.getElementById('filter-mesec');
  const filterGodina = document.getElementById('filter-godina');
  const viewMode = document.getElementById('view-mode');
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

  function postaviDanasnjiDatum() {
    const today = new Date().toISOString().slice(0, 10);
    if (!datumInput.value) datumInput.value = today;
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
    const godina = parseInt(filterGodina.value, 10);
    const mesec = viewMode.value === 'godina' ? null : (filterMesec.value ? parseInt(filterMesec.value, 10) : null);

    return sve.filter(t => {
      const d = new Date(t.datum);
      if (isNaN(d.getTime())) return false;
      if (d.getFullYear() !== godina) return false;
      if (mesec !== null && d.getMonth() + 1 !== mesec) return false;
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

  function formatirajIznos(x) {
    return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(x) + ' RSD';
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
    const id = String(Date.now());
    const nova = {
      id,
      tip: tipSelect.value,
      iznos: parseFloat(iznosInput.value) || 0,
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
    if (viewMode.value === 'godina') {
      filterMesec.value = '';
    } else {
      const d = new Date();
      filterMesec.value = (d.getMonth() + 1).toString();
    }
    osveziPrikaz();
  });

  btnIzvezi.addEventListener('click', function () {
    const transakcije = filtriraneTransakcije().sort((a, b) => new Date(a.datum) - new Date(b.datum));
    if (transakcije.length === 0) {
      alert('Nema transakcija za izvoz.');
      return;
    }
    const header = 'Datum,Tip,Kategorija,Opis,Iznos (RSD)';
    const csv = [header, ...transakcije.map(t => [t.datum, t.tip, t.kategorija, t.opis, t.iznos].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finansije-${filterGodina.value}${filterMesec.value ? '-' + filterMesec.value : ''}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Inicijalizacija
  postaviDanasnjiDatum();
  popuniFilterMesec();
  popuniFilterGodina();
  osveziPrikaz();
})();


