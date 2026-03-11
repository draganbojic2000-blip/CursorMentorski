 (function () {
   const categoriesEl = document.getElementById('categories');
   const contactForm = document.getElementById('contact-form');
   const btnFind = document.getElementById('btn-find-mentor');
   const btnBecome = document.getElementById('btn-become-mentor');

   const categories = [
     {
       label: 'Karijera',
       title: 'IT i programiranje',
       meta: 'Junior → medior, promene karijere, priprema za intervju.'
     },
     {
       label: 'Učenje',
       title: 'Fakultet i ispiti',
       meta: 'Struktura učenja, planiranje roka, motivacija i navike.'
     },
     {
       label: 'Biznis',
       title: 'Mali biznis i freelancing',
       meta: 'Prvi klijenti, ponude, organizacija posla i finansija.'
     },
     {
       label: 'Lični razvoj',
       title: 'Soft skill veštine',
       meta: 'Javni nastup, komunikacija, rad u timu i liderstvo.'
     }
   ];

   function renderCategories() {
     if (!categoriesEl) return;
     categoriesEl.innerHTML = categories
       .map(
         (c) => `
       <article class="category-card">
         <div class="category-pill">
           <span>●</span>
           <span>${c.label}</span>
         </div>
         <h3 class="category-title">${c.title}</h3>
         <p class="category-meta">${c.meta}</p>
       </article>
     `
       )
       .join('');
   }

   function smoothScrollTo(selector) {
     const el = document.querySelector(selector);
     if (!el) return;
     el.scrollIntoView({ behavior: 'smooth', block: 'start' });
   }

   if (btnFind) {
     btnFind.addEventListener('click', function () {
       smoothScrollTo('#mentori');
     });
   }

   if (btnBecome) {
     btnBecome.addEventListener('click', function () {
       smoothScrollTo('#kontakt');
     });
   }

   if (contactForm) {
     contactForm.addEventListener('submit', function (e) {
       e.preventDefault();
       const name = document.getElementById('name')?.value || 'tamo';
       alert(`Hvala, ${name}! Javićemo ti se uskoro na email koji si ostavio/la.`);
       contactForm.reset();
     });
   }

   renderCategories();
 })();

