/* =========================================================
   FORGE & CANVAS — script.js
   Handles: mobile nav, dropdown menus, scroll-reveal animation,
   product gallery swapping, review system (backend simulated
   with localStorage), WhatsApp quick-message panel, newsletter
   form, and a reminder about placeholder image links.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector('.nav-toggle-mobile');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      navToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });
  }

  /* ---------- Dropdown menus (MMA Wear / Sports Wear / Textile Wear) ---------- */
  var dropdownParents = document.querySelectorAll('.nav-links > li.has-dropdown');
  dropdownParents.forEach(function (li) {
    var btn = li.querySelector('.nav-toggle');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = li.classList.contains('open');
      dropdownParents.forEach(function (other) { other.classList.remove('open'); });
      if (!wasOpen) li.classList.add('open');
    });
  });
  document.addEventListener('click', function () {
    dropdownParents.forEach(function (li) { li.classList.remove('open'); });
  });

  /* ---------- Scroll-reveal animation ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Product gallery thumb swap ---------- */
  var mainImg = document.getElementById('gallery-main-img');
  var thumbs = document.querySelectorAll('.gallery-thumbs img');
  if (mainImg && thumbs.length) {
    thumbs.forEach(function (thumb) {
      thumb.parentElement.addEventListener('click', function () {
        var tmp = mainImg.src;
        mainImg.src = thumb.src;
        thumb.src = tmp;
      });
    });
  }

  /* ---------- mailto: fallback ----------
     Clicking a mailto: link only works if the visitor's browser has
     a default email app configured (Outlook, Apple Mail, Gmail app,
     etc). Some browsers, embedded previews, or devices with no mail
     app set up will silently do nothing. As a safety net, this also
     copies the address to the clipboard and confirms it with a toast,
     so the visitor always has the email even if nothing opens. */
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var email = link.getAttribute('href').replace('mailto:', '').split('?')[0];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () {
          showToast('Opening your email app… address copied too: ' + email);
        }).catch(function () {
          showToast('Opening your email app…');
        });
      } else {
        showToast('Email us at ' + email);
      }
    });
  });

  /* ---------- Toast helper ---------- */
  window.showToast = function (message, duration) {
    var toast = document.getElementById('site-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'site-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('show'); }, duration || 4000);
  };

  /* ---------- Placeholder image reminder ----------
     Every product / hero image on this template uses the
     placeholder text "ADD IMAGE LINK HERE" as its src.
     This checks the page for any unreplaced placeholders
     and alerts the site owner once, so real image links can
     be dropped in before the site goes live. */
  var placeholderImages = document.querySelectorAll('img[data-needs-link="true"]');
  if (placeholderImages.length > 0 && !sessionStorage.getItem('imgAlertShown')) {
    sessionStorage.setItem('imgAlertShown', 'true');
    window.setTimeout(function () {
    }, 400);
  }

  /* ================= REVIEW SYSTEM ================= */
  var REVIEW_KEY = 'fc_reviews_v1';

  function loadReviews() {
    try {
      var raw = localStorage.getItem(REVIEW_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveReviews(list) {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(list));
  }

  function renderReviews() {
    var listEl = document.getElementById('review-list');
    if (!listEl) return;
    var reviews = loadReviews().slice().reverse();
    if (reviews.length === 0) {
      listEl.innerHTML = '<p class="review-empty">No reviews yet — be the first to share your experience.</p>';
      return;
    }
    listEl.innerHTML = reviews.map(function (r) {
      var stars = '★★★★★☆☆☆☆☆'.slice(5 - r.rating, 10 - r.rating);
      return '' +
        '<article class="review-card">' +
          '<div class="row">' +
            '<span class="name">' + escapeHtml(r.name) + '</span>' +
            '<span class="stars" aria-label="' + r.rating + ' out of 5 stars">' + stars + '</span>' +
          '</div>' +
          '<div class="date">' + r.date + '</div>' +
          '<p>' + escapeHtml(r.comment) + '</p>' +
        '</article>';
    }).join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  var reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    var starButtons = reviewForm.querySelectorAll('.star-picker button');
    var ratingInput = document.getElementById('review-rating');

    starButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = parseInt(btn.getAttribute('data-value'), 10);
        ratingInput.value = val;
        starButtons.forEach(function (b) {
          b.classList.toggle('active', parseInt(b.getAttribute('data-value'), 10) <= val);
        });
      });
    });

    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('review-name').value.trim();
      var comment = document.getElementById('review-comment').value.trim();
      var rating = parseInt(ratingInput.value, 10) || 0;

      if (!name || !comment || rating === 0) {
        showToast('Please add your name, a comment, and a star rating.');
        return;
      }

      var reviews = loadReviews();
      reviews.push({
        name: name,
        comment: comment,
        rating: rating,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      });
      saveReviews(reviews);
      renderReviews();
      reviewForm.reset();
      ratingInput.value = 0;
      starButtons.forEach(function (b) { b.classList.remove('active'); });
      showToast('Thanks — your review has been posted!');
    });

    renderReviews();
  }

  /* ================= WHATSAPP MESSAGE SYSTEM ================= */
  var WHATSAPP_NUMBER = '+923489617180'; // TODO: replace with your real WhatsApp number, digits only, with country code

  var waFloat = document.getElementById('wa-float');
  var waPanel = document.getElementById('wa-panel');
  var waClose = document.getElementById('wa-close');
  var waSend = document.getElementById('wa-send');
  var waText = document.getElementById('wa-text');

  if (waFloat && waPanel) {
    waFloat.addEventListener('click', function () {
      waPanel.classList.toggle('open');
    });
  }
  if (waClose) {
    waClose.addEventListener('click', function () { waPanel.classList.remove('open'); });
  }
  if (waSend) {
    waSend.addEventListener('click', function () {
      var msg = (waText && waText.value.trim()) || 'Hi! I have a question about your products.';
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'noopener');
      if (waText) waText.value = '';
      waPanel.classList.remove('open');
      showToast('Opening WhatsApp…');
    });
  }

  /* Product page "Enquire on WhatsApp" buttons */
  document.querySelectorAll('[data-wa-product]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var product = btn.getAttribute('data-wa-product');
      var msg = "Hi! I'm interested in the " + product + ". Could you share pricing and availability?";
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'noopener');
    });
  });

  /* Contact page dedicated WhatsApp form */
  var contactWaForm = document.getElementById('contact-wa-form');
  if (contactWaForm) {
    contactWaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('wa-name').value.trim();
      var message = document.getElementById('wa-message').value.trim();
      if (!name || !message) {
        showToast('Please fill in your name and message.');
        return;
      }
      var fullMsg = 'Name: ' + name + '\n' + message;
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(fullMsg);
      window.open(url, '_blank', 'noopener');
      showToast('Opening WhatsApp…');
      contactWaForm.reset();
    });
  }

  /* ================= EMAIL DELIVERY (Formspree) =================
     This is a static site with no server of its own, so real email
     sending is handled by Formspree (https://formspree.io) — a free
     service built exactly for this. Setup (2 minutes):
       1. Go to formspree.io and create a free account.
       2. Create a form — you'll get an endpoint like:
          https://formspree.io/f/abc123xy
       3. Paste that endpoint below, replacing the placeholder text.
       4. Formspree will forward every submission straight to your
          real inbox. You can create one form for everything, or a
          second one for the newsletter so submissions stay separate.
     Until you paste a real endpoint below, forms will show a clear
     "not connected yet" message instead of silently failing. */
  var CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/mzebyqdv';
  var NEWSLETTER_FORM_ENDPOINT = 'https://formspree.io/f/mzebyqdv';

  function submitToFormspree(endpoint, data, onSuccess, onError) {
    if (!endpoint || endpoint.indexOf('REPLACE_WITH') !== -1) {
      onError('Email sending isn\'t connected yet. Add your Formspree endpoint in script.js to activate this form.');
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (res.ok) {
        onSuccess();
      } else {
        res.json().then(function (json) {
          var msg = (json && json.errors && json.errors.length)
            ? json.errors.map(function (er) { return er.message; }).join(', ')
            : 'Something went wrong sending your message. Please try again.';
          onError(msg);
        }).catch(function () {
          onError('Something went wrong sending your message. Please try again.');
        });
      }
    }).catch(function () {
      onError('Network error — please check your connection and try again.');
    });
  }

  function withButtonLoading(form, loadingLabel, task) {
    var btn = form.querySelector('button[type="submit"]');
    var originalHTML = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = loadingLabel; }
    function restore() {
      if (btn) { btn.disabled = false; btn.innerHTML = originalHTML; }
    }
    task(restore);
  }

  /* ================= CONTACT FORM ================= */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('c-name').value.trim();
      var email = document.getElementById('c-email').value.trim();
      var subject = document.getElementById('c-subject').value.trim();
      var message = document.getElementById('c-message').value.trim();

      if (!name || !email || !message) {
        showToast('Please fill in your name, email and message.');
        return;
      }

      withButtonLoading(contactForm, 'Sending…', function (restore) {
        submitToFormspree(CONTACT_FORM_ENDPOINT, {
          name: name,
          email: email,
          subject: subject || 'New website enquiry',
          message: message
        }, function () {
          showToast('Message sent — we will get back to you within 24 hours.');
          contactForm.reset();
          restore();
        }, function (errMsg) {
          showToast(errMsg);
          restore();
        });
      });
    });
  }

  /* ================= NEWSLETTER FORM ================= */
  var newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInput = newsletterForm.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : '';

      if (!email) {
        showToast('Please enter an email address.');
        return;
      }

      withButtonLoading(newsletterForm, 'Subscribing…', function (restore) {
        submitToFormspree(NEWSLETTER_FORM_ENDPOINT, {
          email: email,
          form: 'Newsletter signup'
        }, function () {
          showToast('You\'re subscribed! Watch your inbox for new drops.');
          newsletterForm.reset();
          restore();
        }, function (errMsg) {
          showToast(errMsg);
          restore();
        });
      });
    });
  }

});
