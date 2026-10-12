/**
 * GAJA-SAVIYA Research Project - Main JavaScript
 * Handles:
 * 1. Mobile menu drawer toggle
 * 2. Active navigation state
 * 3. Subtle scroll animations
 * 4. Clipboard helper (Copy Email)
 * 5. Contact form mailto handler
 * 6. Centralized Team Data configuration & image error fallbacks
 */

/* ==========================================================================
   CONFIGURABLE TEAM DATA BLOCK (Edit roles or information easily here)
   ========================================================================== */
const TEAM_CONFIG = [
  {
    name: "Dhananjaya A.G.G",
    id: "IT22145734",
    email: "IT22145734@my.sliit.lk",
    role: "Component 1 - Spatial Risk Surface",
    photo: "assets/member1.jpg"
  },
  {
    name: "Wijesooriya W.M.R.A.B",
    id: "IT22249098",
    email: "IT22249098@my.sliit.lk",
    role: "Component 2 - Sparse-Location Tracker",
    photo: "assets/member2.jpg"
  },
  {
    name: "Gunathilake D.R.G.L",
    id: "IT22544636",
    email: "IT22544636@my.sliit.lk",
    role: "Component 3 - Road-Risk Assessment",
    photo: "assets/member3.jpg"
  },
  {
    name: "Saisuhani L",
    id: "IT22091598",
    email: "IT22091598@my.sliit.lk",
    role: "Component 4 - Path Guard Routing Interface",
    photo: "assets/member4.jpg"
  }
];

// Fallback SVG avatar (used if any member photo is missing or fails to load)
const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%238AA624'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23F3F6E6'/%3E%3Cpath d='M50 48a16 16 0 100-32 16 16 0 000 32zm0 8c-18 0-34 11-38 26 2 2 4 4 7 5 3-12 16-21 31-21s28 9 31 21c3-1 5-3 7-5-4-15-20-26-38-26z' fill='%238AA624'/%3E%3C/svg%3E";

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initActiveNavLink();
  initScrollAnimations();
  initCopyEmail();
  initContactForm();
  initImageFallbacks();
});

/**
 * 1. Mobile Menu Drawer Toggle
 */
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

  if (!menuToggle || !mobileNav) return;

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (mobileNav.classList.contains("open") && !mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  // Close when a link inside mobile drawer is clicked
  const mobileLinks = mobileNav.querySelectorAll(".mobile-link");
  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/**
 * 2. Highlight Active Page Link in Navigation
 */
function initActiveNavLink() {
  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";

  const allNavLinks = document.querySelectorAll(".nav-link, .mobile-link");
  allNavLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === pageName || (pageName === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * 3. Subtle Fade-in on Scroll Observer
 */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll(".fade-in-on-scroll");
  if (!revealElements.length) return;

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.1
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback for browsers without IntersectionObserver
    revealElements.forEach(el => el.classList.add("revealed"));
  }
}

/**
 * 4. Copy Email Helper Function
 */
function initCopyEmail() {
  const copyBtn = document.getElementById("copyEmailBtn");
  if (!copyBtn) return;

  copyBtn.addEventListener("click", () => {
    const emailToCopy = "gajasaviya@gmail.com";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(emailToCopy).then(() => {
        showToast("Email copied to clipboard: " + emailToCopy);
      }).catch(() => {
        fallbackCopyText(emailToCopy);
      });
    } else {
      fallbackCopyText(emailToCopy);
    }
  });
}

function fallbackCopyText(text) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand("copy");
    showToast("Email copied to clipboard: " + text);
  } catch (err) {
    showToast("Please copy manually: " + text);
  }
  document.body.removeChild(tempInput);
}

/**
 * Toast Notification Utility
 */
function showToast(message) {
  let toast = document.getElementById("siteToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "siteToast";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

/**
 * 5. Contact Form Handler (Mailto with Pre-filled Content)
 */
function initContactForm() {
  const form = document.getElementById("contactForm");
  const feedback = document.getElementById("formFeedback");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("nameInput") ? document.getElementById("nameInput").value.trim() : "";
    const email = document.getElementById("emailInput") ? document.getElementById("emailInput").value.trim() : "";
    const subject = document.getElementById("subjectInput") ? document.getElementById("subjectInput").value.trim() : "";
    const message = document.getElementById("messageInput") ? document.getElementById("messageInput").value.trim() : "";

    if (!name || !email || !message) {
      alert("Please fill in your name, email, and message.");
      return;
    }

    const emailSubject = subject || "Inquiry regarding GAJA-SAVIYA Research";
    const emailBody = `Hi GAJA-SAVIYA Team,\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nSent via GAJA-SAVIYA Website`;

    const mailtoUrl = `mailto:gajasaviya@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Show on-page confirmation
    if (feedback) {
      feedback.className = "form-feedback success";
      feedback.innerHTML = `<strong>Thank you, ${name}!</strong> Opening your email client to send your message to <em>gajasaviya@gmail.com</em>.`;
      feedback.style.display = "block";
    }

    // Trigger email client
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 400);

    form.reset();
  });
}

/**
 * 6. Soft Placeholder Avatar Fallback for Photos
 */
function initImageFallbacks() {
  const memberPhotos = document.querySelectorAll(".member-photo");
  memberPhotos.forEach(img => {
    img.addEventListener("error", () => {
      img.src = FALLBACK_AVATAR;
    });
  });
}
