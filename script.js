const slides = document.querySelectorAll(".slides img");
const bannerDots = document.querySelector(".banner-dots");
const pageHeader = document.querySelector("header");

const cartItems = document.getElementById("cart-items");
const totalEl = document.getElementById("total");
const subtotalEl = document.getElementById("cart-subtotal");
const shippingEl = document.getElementById("cart-shipping");
const discountEl = document.getElementById("cart-discount");
const cartCountEl = document.getElementById("cart-count");
const cartBox = document.getElementById("cart-box");
const cartOverlay = document.getElementById("cart-overlay");
const cartEmpty = document.getElementById("cart-empty");
const cartCloseBtn = document.getElementById("cart-close");
const cartClearBtn = document.getElementById("cart-clear");
const cartCheckoutBtn = document.getElementById("cart-checkout");
const couponInput = document.getElementById("coupon-input");
const couponApplyBtn = document.getElementById("coupon-apply");
const shippingCepInput = document.getElementById("shipping-cep");
const shippingCalcBtn = document.getElementById("shipping-calc");
const shippingStatusEl = document.getElementById("shipping-status");
const paymentMethodInputs = Array.from(document.querySelectorAll('input[name="payment-method-checkout"]'));
const cardInstallments = document.getElementById("card-installments");
const checkoutOverlay = document.getElementById("checkout-overlay");
const checkoutModal = document.getElementById("checkout-modal");
const checkoutCloseBtn = document.getElementById("checkout-close");
const stepDeliveryTab = document.getElementById("step-delivery-tab");
const stepPaymentTab = document.getElementById("step-payment-tab");
const stepDelivery = document.getElementById("step-delivery");
const stepPayment = document.getElementById("step-payment");
const goPaymentBtn = document.getElementById("go-payment");
const backDeliveryBtn = document.getElementById("back-delivery");
const confirmOrderBtn = document.getElementById("confirm-order");
const checkoutCepInput = document.getElementById("checkout-cep");
const checkoutCalcShippingBtn = document.getElementById("checkout-calc-shipping");
const checkoutShippingStatus = document.getElementById("checkout-shipping-status");
const checkoutSubtotalEl = document.getElementById("checkout-subtotal");
const checkoutShippingEl = document.getElementById("checkout-shipping");
const checkoutDiscountEl = document.getElementById("checkout-discount");
const checkoutTotalEl = document.getElementById("checkout-total");
const checkoutNameInput = document.getElementById("checkout-name");
const checkoutPhoneInput = document.getElementById("checkout-phone");
const checkoutEmailInput = document.getElementById("checkout-email");
const checkoutDocumentInput = document.getElementById("checkout-document");
const pixOverlay = document.getElementById("pix-overlay");
const pixModal = document.getElementById("pix-modal");
const pixCloseBtn = document.getElementById("pix-close");
const pixQrImage = document.getElementById("pix-qr-image");
const pixCodeEl = document.getElementById("pix-code");
const pixCopyBtn = document.getElementById("pix-copy");
const pixOpenLink = document.getElementById("pix-open-link");
const pixInfoEl = document.getElementById("pix-info");

const ordersOverlay = document.getElementById("orders-overlay");
const ordersModal = document.getElementById("orders-modal");
const ordersCloseBtn = document.getElementById("orders-close");
const ordersList = document.getElementById("orders-list");
const openMenuBtn = document.getElementById("open-menu");
const headerMenu = document.getElementById("header-menu");
const menuOrdersBtn = document.getElementById("menu-orders");
const openSearchBtn = document.getElementById("open-search");
const searchOverlay = document.getElementById("search-overlay");
const searchModal = document.getElementById("search-modal");
const searchCloseBtn = document.getElementById("search-close");
const searchModalInput = document.getElementById("search-modal-input");
const searchModalSummary = document.getElementById("search-modal-summary");
const searchModalResults = document.getElementById("search-modal-results");
const searchRecent = document.getElementById("search-recent");
const openAccountBtn = document.getElementById("open-account");
const accountOverlay = document.getElementById("account-overlay");
const accountModal = document.getElementById("account-modal");
const accountCloseBtn = document.getElementById("account-close");
const accountModalSubtitle = document.getElementById("account-modal-subtitle");
const accountTabs = document.getElementById("account-tabs");
const accountTabLoginBtn = document.getElementById("account-tab-login");
const accountTabRegisterBtn = document.getElementById("account-tab-register");
const accountLoginForm = document.getElementById("account-login-form");
const accountRegisterForm = document.getElementById("account-register-form");
const accountLogged = document.getElementById("account-logged");
const accountUserName = document.getElementById("account-user-name");
const accountUserEmail = document.getElementById("account-user-email");
const accountLogoutBtn = document.getElementById("account-logout");
const accountFeedback = document.getElementById("account-feedback");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const registerNameInput = document.getElementById("register-name");
const registerPhoneInput = document.getElementById("register-phone");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const registerPasswordConfirmInput = document.getElementById("register-password-confirm");

const cartIcon = document.querySelector(".cart-icon");
const cards = Array.from(document.querySelectorAll(".card"));

const CART_STORAGE_KEY = "kellystudio_cart_v1";
const COUPON_STORAGE_KEY = "kellystudio_coupon_v1";
const CHECKOUT_STORAGE_KEY = "kellystudio_checkout_v1";
const ORDERS_STORAGE_KEY = "kellystudio_orders_v1";
const SEARCH_RECENTS_KEY = "kellystudio_recent_searches_v1";
const ACCOUNTS_STORAGE_KEY = "kellystudio_accounts_v1";
const ACCOUNT_SESSION_STORAGE_KEY = "kellystudio_account_session_v1";
const SHIPPING_FEE = 19.9;
const FREE_SHIPPING_FROM = 199;
const VALID_COUPONS = {
  PINK10: 0.1,
};
const ORDER_PROGRESS_STEPS = [
  "Aguardando pagamento",
  "Pagamento aprovado",
  "Em separação",
  "Enviado",
  "Entregue",
];
const PAYMENT_CONFIG = window.KELLY_PAYMENT_CONFIG || {};
const PAYMENT_API_BASE = PAYMENT_CONFIG.apiBase || "/.netlify/functions";

const sectionCategoryMap = {
  "mais-vendidos": "Mais Vendidos",
  calcas: "Calças",
  camisas: "Camisas",
  calcinha: "Calcinhas",
  body: "Body",
  outros: "Outros",
  catalogo: "Produtos",
};
const SEARCH_CATEGORY_SUGGESTIONS = Array.from(new Set(Object.values(sectionCategoryMap)))
  .filter((category) => category !== "Produtos");

let slideIndex = 0;
let slideTimer = null;
let cart = [];
let appliedCoupon = "";
let shippingBase = SHIPPING_FEE;
let shippingCalculated = false;
let shippingLocation = "";
let paymentMethod = "pix";
let orderHistory = [];
let searchMatches = [];
let recentSearches = [];
let accountList = [];
let currentUser = null;
let accountActiveTab = "login";
let orderSyncInFlight = false;

function syncHeaderOffset() {
  if (!pageHeader) return;
  const measuredHeight = Math.round(pageHeader.getBoundingClientRect().height);
  const mobileCompensation = window.innerWidth <= 900 ? 3 : 0;
  const finalOffset = Math.max(0, measuredHeight - mobileCompensation);
  document.body.style.paddingTop = `${finalOffset}px`;
}

function trackEvent(eventName, payload = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }

  if (typeof window.fbq === "function") {
    if (eventName === "add_to_cart") {
      window.fbq("track", "AddToCart", payload);
    } else if (eventName === "begin_checkout") {
      window.fbq("track", "InitiateCheckout", payload);
    } else if (eventName === "purchase") {
      window.fbq("track", "Purchase", payload);
    }
  }
}

function formatPrice(value) {
  return value.toFixed(2).replace(".", ",");
}

function formatDateTime(isoDate) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderProgress(order) {
  if (order?.status === "Pagamento recusado") {
    return {
      index: 0,
      label: "Pagamento recusado",
    };
  }

  const statusIndexByLabel = {
    "Aguardando pagamento": 0,
    "Pagamento aprovado": 1,
    "Confirmado": 1,
    "Em separação": 2,
    Enviado: 3,
    Entregue: 4,
  };

  const explicitIndex = statusIndexByLabel[order?.status];
  if (Number.isInteger(explicitIndex)) {
    return {
      index: explicitIndex,
      label: ORDER_PROGRESS_STEPS[explicitIndex],
    };
  }

  const createdAt = new Date(order?.createdAt || "");
  if (Number.isNaN(createdAt.getTime())) {
    return { index: 0, label: ORDER_PROGRESS_STEPS[0] };
  }

  const elapsedHours = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
  let index = 0;

  if (elapsedHours >= 72) index = 4;
  else if (elapsedHours >= 36) index = 3;
  else if (elapsedHours >= 12) index = 2;
  else if (elapsedHours >= 2) index = 1;

  return {
    index,
    label: ORDER_PROGRESS_STEPS[index],
  };
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeText(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

function levenshteinWithinOne(a, b) {
  if (a === b) return true;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 1) return false;
  if (lenA < 3 || lenB < 3) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < lenA && j < lenB) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;

    if (lenA > lenB) i += 1;
    else if (lenB > lenA) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }

  if (i < lenA || j < lenB) edits += 1;
  return edits <= 1;
}

function maskCep(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function estimateShippingByState(state) {
  const north = ["AC", "AP", "AM", "PA", "RO", "RR", "TO"];
  const northeast = ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"];
  const south = ["PR", "RS", "SC"];
  const southeast = ["ES", "MG", "RJ", "SP"];
  const central = ["DF", "GO", "MS", "MT"];

  if (north.includes(state)) return 29.9;
  if (northeast.includes(state)) return 24.9;
  if (south.includes(state) || southeast.includes(state)) return 16.9;
  if (central.includes(state)) return 19.9;
  return SHIPPING_FEE;
}

function getCardData(card) {
  const name = card.querySelector("h3")?.innerText.trim() ?? "";
  const priceText = card.querySelector("p")?.innerText ?? "R$ 0,00";
  const price = Number.parseFloat(priceText.replace("R$ ", "").replace(",", "."));

  return {
    name,
    price: Number.isNaN(price) ? 0 : price,
    image: card.querySelector("img")?.src ?? "",
    alt: card.querySelector("img")?.alt ?? name,
  };
}

const products = cards.map((card) => {
  const section = card.closest("section");
  const sectionId = section?.id ?? "catalogo";
  const category = sectionCategoryMap[sectionId] ?? "Produtos";
  const data = getCardData(card);
  const normalizedName = normalizeText(data.name);
  const normalizedCategory = normalizeText(category);
  const tokens = new Set([...tokenizeText(data.name), ...tokenizeText(category)]);

  return {
    ...data,
    card,
    category,
    normalizedName,
    normalizedCategory,
    tokens
  };
});

function buildProductSchema() {
  const uniqueProducts = [];
  const seen = new Set();

  products.forEach((product) => {
    const key = `${product.name}|${product.price}`;
    if (seen.has(key)) return;
    seen.add(key);
    uniqueProducts.push(product);
  });

  const topProducts = uniqueProducts.slice(0, 30);
  const pageUrl = window.location.href.split("#")[0];

  const itemListElement = topProducts.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: pageUrl,
    item: {
      "@type": "Product",
      name: product.name,
      category: product.category,
      image: product.image ? [product.image] : undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: Number(product.price.toFixed(2)),
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition"
      },
      brand: {
        "@type": "Brand",
        name: "Kelly Studio"
      }
    }
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Catálogo de Moda Feminina - Kelly Studio",
        inLanguage: "pt-BR",
        about: "Moda feminina em Brasília - DF",
        mainEntity: {
          "@type": "ItemList",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: itemListElement.length,
          itemListElement
        }
      }
    ]
  };
}

function injectProductSchema() {
  const schemaScript = document.createElement("script");
  schemaScript.type = "application/ld+json";
  schemaScript.text = JSON.stringify(buildProductSchema());
  document.head.appendChild(schemaScript);
}

function loadRecentSearches() {
  try {
    const stored = JSON.parse(localStorage.getItem(SEARCH_RECENTS_KEY) || "[]");
    recentSearches = Array.isArray(stored) ? stored.filter((item) => typeof item === "string") : [];
  } catch {
    recentSearches = [];
  }
}

function saveRecentSearches() {
  localStorage.setItem(SEARCH_RECENTS_KEY, JSON.stringify(recentSearches.slice(0, 8)));
}

function addRecentSearch(query) {
  const clean = query.trim();
  if (clean.length < 2) return;
  recentSearches = [clean, ...recentSearches.filter((item) => normalizeText(item) !== normalizeText(clean))].slice(0, 8);
  saveRecentSearches();
}

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function maskPhone(value = "") {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeCpf(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 11);
}

function maskCpf(value = "") {
  const digits = normalizeCpf(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCpf(value = "") {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  return secondDigit === Number(cpf[10]);
}

function setAccountFeedback(message = "", type = "info") {
  if (!accountFeedback) return;
  accountFeedback.textContent = message;
  accountFeedback.classList.remove("info", "error", "success");
  if (message) {
    accountFeedback.classList.add(type);
  }
}

function saveAccountsState() {
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accountList));
}

function loadAccountsState() {
  try {
    const stored = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || "[]");
    accountList = Array.isArray(stored)
      ? stored
        .filter((account) => account && account.name && account.email && account.password)
        .map((account) => ({
          name: String(account.name).trim(),
          phone: String(account.phone || ""),
          email: normalizeEmail(account.email),
          password: String(account.password),
          createdAt: account.createdAt || new Date().toISOString(),
        }))
      : [];
  } catch {
    accountList = [];
  }
}

function saveAccountSession() {
  if (currentUser) {
    localStorage.setItem(
      ACCOUNT_SESSION_STORAGE_KEY,
      JSON.stringify({
        email: currentUser.email,
      })
    );
    return;
  }

  localStorage.removeItem(ACCOUNT_SESSION_STORAGE_KEY);
}

function loadAccountSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY) || "{}");
    const email = normalizeEmail(stored.email || "");
    if (!email) {
      currentUser = null;
      return;
    }

    const account = accountList.find((item) => normalizeEmail(item.email) === email);
    currentUser = account
      ? {
        name: account.name,
        phone: account.phone,
        email: account.email,
      }
      : null;

    if (!currentUser) {
      localStorage.removeItem(ACCOUNT_SESSION_STORAGE_KEY);
    }
  } catch {
    currentUser = null;
  }
}

function updateAccountButtonState() {
  if (!openAccountBtn) return;
  const isLogged = Boolean(currentUser);
  openAccountBtn.classList.toggle("logged", isLogged);
  openAccountBtn.setAttribute("aria-label", isLogged ? `Minha conta (${currentUser.name})` : "Entrar ou cadastrar");
}

function fillCheckoutFromAccount(force = false) {
  if (!currentUser) return;

  if (force || !checkoutNameInput.value.trim()) {
    checkoutNameInput.value = currentUser.name || "";
  }

  if (force || !checkoutPhoneInput.value.trim()) {
    checkoutPhoneInput.value = currentUser.phone || "";
  }

  if (force || !checkoutEmailInput.value.trim()) {
    checkoutEmailInput.value = currentUser.email || "";
  }
}

function setAccountTab(tab) {
  accountActiveTab = tab === "register" ? "register" : "login";
  const loginActive = accountActiveTab === "login";

  accountTabLoginBtn?.classList.toggle("active", loginActive);
  accountTabRegisterBtn?.classList.toggle("active", !loginActive);
  accountLoginForm?.classList.toggle("active", loginActive);
  accountRegisterForm?.classList.toggle("active", !loginActive);
}

function renderAccountModal() {
  const isLogged = Boolean(currentUser);

  if (!accountModal) return;

  accountLogged.hidden = !isLogged;
  accountTabs.hidden = isLogged;
  accountLoginForm.hidden = isLogged;
  accountRegisterForm.hidden = isLogged;

  if (isLogged) {
    accountModalSubtitle.textContent = "Seus dados de acesso estão ativos.";
    accountUserName.textContent = currentUser.name || "Cliente";
    accountUserEmail.textContent = currentUser.email || "-";
  } else {
    accountModalSubtitle.textContent = "Entre ou crie sua conta para acompanhar pedidos com facilidade.";
    setAccountTab(accountActiveTab);
  }
}

function openAccountModal(preferredTab = null, infoMessage = "") {
  if (preferredTab) setAccountTab(preferredTab);

  closeHeaderMenu();
  closePixModal();
  toggleCart(false);
  closeCheckoutModal();
  closeOrdersModal();
  closeSearchModal();

  renderAccountModal();
  accountOverlay?.classList.add("open");
  accountModal?.classList.add("open");

  if (infoMessage) {
    setAccountFeedback(infoMessage, "info");
  } else {
    setAccountFeedback("", "info");
  }

  setTimeout(() => {
    if (currentUser) return;

    if (accountActiveTab === "register") {
      registerNameInput?.focus();
      return;
    }

    loginEmailInput?.focus();
  }, 10);
}

function closeAccountModal() {
  accountOverlay?.classList.remove("open");
  accountModal?.classList.remove("open");
}

function openHeaderMenu() {
  closePixModal();
  closeSearchModal();
  closeAccountModal();
  toggleCart(false);
  closeCheckoutModal();
  closeOrdersModal();
  headerMenu?.classList.add("open");
  openMenuBtn?.classList.add("active");
}

function closeHeaderMenu() {
  headerMenu?.classList.remove("open");
  openMenuBtn?.classList.remove("active");
}

function toggleHeaderMenu() {
  if (headerMenu?.classList.contains("open")) {
    closeHeaderMenu();
    return;
  }
  openHeaderMenu();
}

function getOrdersForCurrentUser() {
  if (!currentUser?.email) return [];
  const userEmail = normalizeEmail(currentUser.email);
  return orderHistory.filter((order) => normalizeEmail(order.accountEmail || order.customerEmail || "") === userEmail);
}

function scoreProduct(product, normalizedQuery, queryTokens) {
  let score = 0;

  if (product.normalizedName === normalizedQuery) score += 140;
  if (product.normalizedName.startsWith(normalizedQuery)) score += 120;
  if (product.normalizedName.includes(normalizedQuery)) score += 90;
  if (product.normalizedCategory.includes(normalizedQuery)) score += 40;

  queryTokens.forEach((token) => {
    if (product.tokens.has(token)) {
      score += 26;
      return;
    }

    const tokenList = [...product.tokens];
    if (tokenList.some((item) => item.startsWith(token) || token.startsWith(item))) {
      score += 16;
      return;
    }

    if (tokenList.some((item) => levenshteinWithinOne(item, token))) {
      score += 10;
    }
  });

  return score;
}

function getSearchMatches(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenizeText(query);
  return products
    .map((product) => ({ product, score: scoreProduct(product, normalizedQuery, queryTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, 18)
    .map((entry) => entry.product);
}

function getSuggestedCategories() {
  return SEARCH_CATEGORY_SUGGESTIONS.slice(0, 8);
}

function focusProduct(product) {
  closeSearchModal();
  product.card.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  product.card.classList.add("search-hit");
  setTimeout(() => product.card.classList.remove("search-hit"), 1000);
}

function renderRecentSearches() {
  if (!searchRecent) return;

  const terms = getSuggestedCategories();

  if (terms.length === 0) {
    searchRecent.hidden = true;
    searchRecent.innerHTML = "";
    return;
  }

  searchRecent.hidden = false;
  searchRecent.innerHTML = "";

  terms.forEach((term, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "search-chip suggestion";
    chip.textContent = term;
    chip.addEventListener("click", () => {
      searchModalInput.value = term;
      updateSearchModal(term);
    });
    searchRecent.appendChild(chip);
  });
}

function renderSearchResults(matches, searchTerm = "") {
  searchModalResults.innerHTML = "";

  if (matches.length === 0) {
    searchModalResults.innerHTML = '<div class="search-empty">Nenhum produto encontrado.</div>';
    return;
  }

  matches.forEach((product) => {
    const item = document.createElement("article");
    item.className = "search-result-item";
    item.innerHTML = `
      <img src="${product.image}" alt="${product.alt}">
      <div class="search-result-info">
        <h4>${product.name}</h4>
        <p>${product.category}</p>
        <strong>R$ ${formatPrice(product.price)}</strong>
      </div>
      <div class="search-result-actions">
        <button type="button" class="search-view-btn">Ver produto</button>
        <button type="button" class="search-add-btn">Adicionar</button>
      </div>
    `;

    item.querySelector(".search-view-btn").addEventListener("click", () => {
      focusProduct(product);
    });

    item.querySelector(".search-add-btn").addEventListener("click", () => {
      addToCart(product.name, product.price, product.image, product.alt);
    });

    searchModalResults.appendChild(item);
  });
}

function updateSearchModal(query) {
  const term = String(query || "").trim();
  if (!term) {
    searchModalSummary.textContent = "Escolha uma categoria para começar";
    searchMatches = [];
    searchModalResults.innerHTML = "";
    renderRecentSearches();
    return;
  }

  searchRecent.hidden = true;
  searchMatches = getSearchMatches(term);
  searchModalSummary.textContent = `${searchMatches.length} resultado(s) para "${term}".`;
  renderSearchResults(searchMatches, term);
}

function openSearchModal() {
  closeHeaderMenu();
  closePixModal();
  toggleCart(false);
  closeCheckoutModal();
  closeOrdersModal();
  closeAccountModal();
  searchOverlay.classList.add("open");
  searchModal.classList.add("open");
  searchModalInput.value = "";
  updateSearchModal("");
  renderRecentSearches();
  setTimeout(() => {
    searchModalInput.focus();
    searchModalInput.select();
  }, 10);
}

function closeSearchModal() {
  searchOverlay.classList.remove("open");
  searchModal.classList.remove("open");
}

function goToSlide(index) {
  slides[slideIndex]?.classList.remove("active");
  slideIndex = index;
  slides[slideIndex]?.classList.add("active");

  if (!bannerDots) return;

  bannerDots.querySelectorAll(".dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === slideIndex);
  });
}

function startSlider() {
  if (slides.length <= 1) return;
  if (slideTimer) clearInterval(slideTimer);

  slideTimer = setInterval(() => {
    const nextIndex = (slideIndex + 1) % slides.length;
    goToSlide(nextIndex);
  }, 3000);
}

function stopSlider() {
  if (!slideTimer) return;
  clearInterval(slideTimer);
  slideTimer = null;
}

if (slides.length > 0) {
  goToSlide(0);

  if (bannerDots && slides.length > 1) {
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("aria-label", `Ir para slide ${index + 1}`);
      dot.addEventListener("click", () => {
        goToSlide(index);
        startSlider();
      });
      bannerDots.appendChild(dot);
    });
  }

  startSlider();
}

syncHeaderOffset();
window.addEventListener("resize", syncHeaderOffset);
window.addEventListener("orientationchange", syncHeaderOffset);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSlider();
  } else {
    startSlider();
  }
});

function saveCartState() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  localStorage.setItem(COUPON_STORAGE_KEY, appliedCoupon);
  localStorage.setItem(
    CHECKOUT_STORAGE_KEY,
    JSON.stringify({
      cep: shippingCepInput.value.trim(),
      shippingBase,
      shippingCalculated,
      shippingLocation,
      paymentMethod,
      installments: cardInstallments.value,
    })
  );
}

function loadCartState() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (Array.isArray(stored)) {
      cart = stored
        .filter((item) => item && item.name && Number(item.price) >= 0)
        .map((item) => ({
          name: item.name,
          price: Number(item.price),
          qty: Math.max(1, Number(item.qty) || 1),
          image: item.image || "",
          alt: item.alt || item.name,
        }));
    }
  } catch {
    cart = [];
  }

  const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY) || "";
  if (VALID_COUPONS[storedCoupon]) {
    appliedCoupon = storedCoupon;
    couponInput.value = storedCoupon;
  }

  try {
    const checkoutState = JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY) || "{}");
    shippingCepInput.value = checkoutState.cep || "";
    shippingBase = Number(checkoutState.shippingBase) || SHIPPING_FEE;
    shippingCalculated = Boolean(checkoutState.shippingCalculated);
    shippingLocation = checkoutState.shippingLocation || "";
    paymentMethod = checkoutState.paymentMethod || "pix";
    cardInstallments.value = checkoutState.installments || "1";
  } catch {
    paymentMethod = "pix";
  }

  const selectedInput = paymentMethodInputs.find((input) => input.value === paymentMethod) || paymentMethodInputs[0];
  if (selectedInput) {
    selectedInput.checked = true;
    paymentMethod = selectedInput.value;
  }
}

function saveOrdersState() {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orderHistory));
}

function loadOrdersState() {
  try {
    const stored = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    orderHistory = Array.isArray(stored) ? stored : [];
  } catch {
    orderHistory = [];
  }
}

function renderOrders() {
  if (!ordersList) return;

  if (!currentUser) {
    ordersList.innerHTML = '<div class="order-empty">Entre na sua conta para ver seus pedidos.</div>';
    return;
  }

  const userOrders = getOrdersForCurrentUser();
  if (userOrders.length === 0) {
    ordersList.innerHTML = '<div class="order-empty">Você ainda não tem pedidos confirmados.</div>';
    return;
  }

  ordersList.innerHTML = "";

  userOrders.forEach((order) => {
    const article = document.createElement("article");
    article.className = "order-card";
    const progress = getOrderProgress(order);

    const safeItems = Array.isArray(order.items) ? order.items : [];
    const itemLines = safeItems
      .map((item) => `${item.qty}x ${item.name} - R$ ${formatPrice(item.price * item.qty)}`)
      .join("<br>") || "Sem itens detalhados.";
    const stepLines = ORDER_PROGRESS_STEPS.map((step, index) => {
      const doneClass = index <= progress.index ? "done" : "";
      const currentClass = index === progress.index ? "current" : "";
      return `
        <div class="order-step ${doneClass} ${currentClass}">
          <span class="order-step-dot"></span>
          <span class="order-step-label">${step}</span>
        </div>
      `;
    }).join("");

    article.innerHTML = `
      <div class="order-top">
        <span class="order-id">Pedido ${order.id}</span>
        <span class="order-status">${progress.label}</span>
      </div>
      <div class="order-meta">
        <span>Data: ${formatDateTime(order.createdAt)}</span>
        <span>Cliente: ${order.customerName}</span>
        <span>Pagamento: ${order.paymentLabel}</span>
        <span>Total: <strong>R$ ${formatPrice(order.total)}</strong></span>
      </div>
      <div class="order-progress">${stepLines}</div>
      <div class="order-items">
        <strong>Itens</strong>
        <span>${itemLines}</span>
      </div>
    `;

    ordersList.appendChild(article);
  });
}

function openOrdersModal() {
  closeHeaderMenu();
  closePixModal();
  if (!currentUser) {
    openAccountModal("login", "Entre na sua conta para acessar seus pedidos.");
    return;
  }

  closeAccountModal();
  renderOrders();
  ordersOverlay.classList.add("open");
  ordersModal.classList.add("open");
  void syncOrderStatusesFromGateway();
}

function closeOrdersModal() {
  ordersOverlay.classList.remove("open");
  ordersModal.classList.remove("open");
}

function closePixModal() {
  pixOverlay?.classList.remove("open");
  pixModal?.classList.remove("open");
}

function openPixModal(payment, order) {
  closeHeaderMenu();
  toggleCart(false);
  closeCheckoutModal();
  closeOrdersModal();
  closeAccountModal();
  closeSearchModal();

  const qrCode = String(payment?.qrCode || "");
  const qrCodeBase64 = String(payment?.qrCodeBase64 || "");
  const ticketUrl = String(payment?.ticketUrl || "");
  const expiresAt = payment?.expiresAt ? formatDateTime(payment.expiresAt) : "";

  if (pixCodeEl) {
    pixCodeEl.value = qrCode;
  }

  if (pixQrImage) {
    if (qrCodeBase64) {
      pixQrImage.src = `data:image/png;base64,${qrCodeBase64}`;
      pixQrImage.style.display = "block";
    } else {
      pixQrImage.removeAttribute("src");
      pixQrImage.style.display = "none";
    }
  }

  if (pixOpenLink) {
    if (ticketUrl) {
      pixOpenLink.href = ticketUrl;
      pixOpenLink.style.display = "inline-flex";
    } else {
      pixOpenLink.href = "#";
      pixOpenLink.style.display = "none";
    }
  }

  if (pixInfoEl) {
    const baseInfo = `Pedido ${order.id} - Total R$ ${formatPrice(order.total)}.`;
    pixInfoEl.textContent = expiresAt
      ? `${baseInfo} Pix válido até ${expiresAt}.`
      : `${baseInfo} Finalize o pagamento para confirmar seu pedido.`;
  }

  if (pixCopyBtn) {
    pixCopyBtn.textContent = "Copiar código Pix";
  }

  pixOverlay?.classList.add("open");
  pixModal?.classList.add("open");
}

async function copyPixCode() {
  const code = String(pixCodeEl?.value || "").trim();
  if (!code) {
    alert("Código Pix indisponível para cópia.");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(code);
    } else if (pixCodeEl) {
      pixCodeEl.focus();
      pixCodeEl.select();
      document.execCommand("copy");
    }

    if (pixCopyBtn) {
      pixCopyBtn.textContent = "Código copiado!";
      setTimeout(() => {
        pixCopyBtn.textContent = "Copiar código Pix";
      }, 1500);
    }
  } catch {
    alert("Não foi possível copiar automaticamente. Copie manualmente o código.");
  }
}

function mapMpStatusToOrderStatus(status) {
  const safeStatus = String(status || "").toLowerCase();
  if (safeStatus === "approved" || safeStatus === "authorized") return "Pagamento aprovado";
  if (safeStatus === "rejected" || safeStatus === "cancelled" || safeStatus === "charged_back" || safeStatus === "refunded") {
    return "Pagamento recusado";
  }
  return "Aguardando pagamento";
}

async function fetchLatestOrderStatus(orderId) {
  const response = await fetch(
    `${PAYMENT_API_BASE}/payment-status-v2?order_id=${encodeURIComponent(orderId)}`,
    { method: "GET" }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error || "Erro ao consultar status do pagamento.";
    throw new Error(message);
  }

  return payload;
}

async function syncOrderStatusesFromGateway() {
  if (orderSyncInFlight || !Array.isArray(orderHistory) || orderHistory.length === 0) return;

  const ordersToSync = orderHistory.filter((order) => {
    if (!order?.id) return false;
    const currentStatus = String(order.status || "").toLowerCase();
    return currentStatus !== "entregue" && currentStatus !== "enviado";
  });

  if (ordersToSync.length === 0) return;

  orderSyncInFlight = true;
  let changed = false;

  try {
    const results = await Promise.all(
      ordersToSync.map(async (order) => {
        try {
          const remote = await fetchLatestOrderStatus(order.id);
          return { orderId: order.id, remote };
        } catch {
          return { orderId: order.id, remote: null };
        }
      })
    );

    results.forEach(({ orderId, remote }) => {
      if (!remote || !remote.found) return;

      const target = orderHistory.find((order) => order.id === orderId);
      if (!target) return;

      const mappedStatus = remote.orderStatus || mapMpStatusToOrderStatus(remote.mpStatus);
      const nextPaymentLabel = (() => {
        const method = String(remote.paymentMethod || "").toLowerCase();
        if (method === "pix") return "Pix";
        if (method.includes("bol")) return "Boleto";
        return target.paymentLabel;
      })();

      if (mappedStatus && target.status !== mappedStatus) {
        target.status = mappedStatus;
        changed = true;
      }

      if (remote.mpStatus && target.mpStatus !== remote.mpStatus) {
        target.mpStatus = remote.mpStatus;
        changed = true;
      }

      if (remote.paymentId && target.paymentId !== String(remote.paymentId)) {
        target.paymentId = String(remote.paymentId);
        changed = true;
      }

      if (nextPaymentLabel && target.paymentLabel !== nextPaymentLabel) {
        target.paymentLabel = nextPaymentLabel;
        changed = true;
      }
    });

    if (changed) {
      saveOrdersState();
      renderOrders();
    }
  } finally {
    orderSyncInFlight = false;
  }
}

function getPaymentLabel() {
  if (paymentMethod === "pix") return "Pix";
  if (paymentMethod === "boleto") return "Boleto";
  if (paymentMethod === "card") return `Cartão (${cardInstallments.value}x)`;
  return paymentMethod.toUpperCase();
}

async function createPaymentSession(order) {
  const config = window.KELLY_PAYMENT_CONFIG || {};
  const response = await fetch(`${PAYMENT_API_BASE}/create-payment-v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: config.provider || "mercado_pago",
      order,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error || "Falha ao criar pagamento.";
    const details = payload?.details ? `\n${String(payload.details)}` : "";
    throw new Error(`${message}${details}`);
  }

  return payload;
}

function createOrder() {
  const subtotal = getCartSubtotal();
  const discount = getCartDiscount(subtotal);
  const shipping = getCartShipping(subtotal - discount);
  const total = Math.max(0, subtotal - discount + shipping);
  const orderNumber = `#KS${String(Date.now()).slice(-6)}`;
  const resolvedEmail = normalizeEmail(currentUser?.email || checkoutEmailInput.value.trim());
  const resolvedName = currentUser?.name || checkoutNameInput.value.trim() || "Cliente";
  const resolvedPhone = currentUser?.phone || checkoutPhoneInput.value.trim() || "-";
  const resolvedDocument = normalizeCpf(checkoutDocumentInput?.value || "");

  return {
    id: orderNumber,
    createdAt: new Date().toISOString(),
    status: "Aguardando pagamento",
    customerName: resolvedName,
    customerPhone: resolvedPhone,
    customerEmail: resolvedEmail,
    customerDocument: resolvedDocument,
    accountEmail: resolvedEmail,
    shippingLocation: shippingLocation || "Não informado",
    paymentLabel: getPaymentLabel(),
    subtotal,
    discount,
    shipping,
    total,
    items: cart.map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
  };
}

function getCartCount() {
  return cart.reduce((acc, item) => acc + item.qty, 0);
}

function getCartSubtotal() {
  return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
}

function getCartDiscount(subtotal) {
  const discountRate = VALID_COUPONS[appliedCoupon] || 0;
  return subtotal * discountRate;
}

function getCartShipping(subtotalAfterDiscount) {
  if (subtotalAfterDiscount === 0) return 0;
  if (subtotalAfterDiscount >= FREE_SHIPPING_FROM) return 0;
  return shippingBase;
}

function updateShippingStatus(subtotal, discount, shipping) {
  const afterDiscount = subtotal - discount;

  if (!shippingCalculated) {
    shippingStatusEl.textContent = "Informe seu CEP para calcular o frete.";
    return;
  }

  if (afterDiscount >= FREE_SHIPPING_FROM) {
    shippingStatusEl.textContent = `Frete grátis para ${shippingLocation}.`;
    return;
  }

  shippingStatusEl.textContent = `Frete para ${shippingLocation}: R$ ${formatPrice(shipping)}.`;
}

async function calculateShippingByCep(cepValue, statusTarget = shippingStatusEl) {
  const cep = (cepValue ?? shippingCepInput.value).replace(/\D/g, "");

  if (cep.length !== 8) {
    shippingCalculated = false;
    shippingLocation = "";
    statusTarget.textContent = "CEP inválido. Digite 8 números.";
    renderCart();
    return;
  }

  statusTarget.textContent = "Calculando frete...";

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado");
    }

    const state = String(data.uf || "").toUpperCase();
    shippingBase = estimateShippingByState(state);
    shippingCalculated = true;
    shippingLocation = `${data.localidade || "Cidade"}, ${state}`;
    renderCart();
    statusTarget.textContent = shippingStatusEl.textContent;
  } catch {
    shippingCalculated = false;
    shippingLocation = "";
    statusTarget.textContent = "Não foi possível calcular agora. Tente novamente.";
  }
}

function renderCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartEmpty.style.display = "block";
  } else {
    cartEmpty.style.display = "none";
  }

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.dataset.name = item.name;
    li.innerHTML = `
      <img src="${item.image}" alt="${item.alt}">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>R$ ${formatPrice(item.price)}</p>
        <div class="cart-item-controls">
          <button type="button" data-action="decrease" data-name="${item.name}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-action="increase" data-name="${item.name}">+</button>
          <button type="button" class="remove" data-action="remove" data-name="${item.name}">Remover</button>
        </div>
      </div>
    `;
    cartItems.appendChild(li);
  });

  const subtotal = getCartSubtotal();
  const discount = getCartDiscount(subtotal);
  const shipping = getCartShipping(subtotal - discount);
  const total = Math.max(0, subtotal - discount + shipping);

  subtotalEl.textContent = formatPrice(subtotal);
  discountEl.textContent = formatPrice(discount);
  shippingEl.textContent = formatPrice(shipping);
  totalEl.textContent = formatPrice(total);
  cartCountEl.textContent = String(getCartCount());
  cardInstallments.disabled = paymentMethod !== "card";

  updateShippingStatus(subtotal, discount, shipping);
  saveCartState();
}

function animateCartIcon() {
  cartIcon.classList.remove("animate");
  void cartIcon.offsetWidth;
  cartIcon.classList.add("animate");
}

function addToCart(name, price, image = "", alt = "") {
  const existing = cart.find((item) => item.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1, image, alt: alt || name });
  }

  renderCart();
  animateCartIcon();
  trackEvent("add_to_cart", {
    currency: "BRL",
    value: Number(price.toFixed(2)),
    item_name: name
  });
}

function changeItemQty(name, delta) {
  const item = cart.find((entry) => entry.name === name);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((entry) => entry.name !== name);
  }

  renderCart();
}

function removeItem(name) {
  cart = cart.filter((item) => item.name !== name);
  renderCart();
}

function toggleCart(openState) {
  const shouldOpen = typeof openState === "boolean" ? openState : !cartBox.classList.contains("open");
  if (shouldOpen) {
    closeHeaderMenu();
    closePixModal();
    closeSearchModal();
    closeCheckoutModal();
    closeOrdersModal();
    closeAccountModal();
  }
  cartBox.classList.toggle("open", shouldOpen);
  cartOverlay.classList.toggle("open", shouldOpen);
}

function setCheckoutStep(step) {
  const deliveryActive = step === "delivery";
  stepDelivery.classList.toggle("active", deliveryActive);
  stepPayment.classList.toggle("active", !deliveryActive);
  stepDeliveryTab.classList.toggle("active", deliveryActive);
  stepPaymentTab.classList.toggle("active", !deliveryActive);
}

function updateCheckoutSummary() {
  const subtotal = getCartSubtotal();
  const discount = getCartDiscount(subtotal);
  const shipping = getCartShipping(subtotal - discount);
  const total = Math.max(0, subtotal - discount + shipping);

  checkoutSubtotalEl.textContent = formatPrice(subtotal);
  checkoutShippingEl.textContent = formatPrice(shipping);
  checkoutDiscountEl.textContent = formatPrice(discount);
  checkoutTotalEl.textContent = formatPrice(total);
}

function openCheckoutModal() {
  closePixModal();
  fillCheckoutFromAccount(true);
  checkoutCepInput.value = shippingCepInput.value;
  checkoutShippingStatus.textContent = shippingStatusEl.textContent;
  updateCheckoutSummary();
  setCheckoutStep("delivery");
  checkoutOverlay.classList.add("open");
  checkoutModal.classList.add("open");
}

function closeCheckoutModal() {
  checkoutOverlay.classList.remove("open");
  checkoutModal.classList.remove("open");
}

function clearCart() {
  cart = [];
  renderCart();
}

function applyCoupon() {
  const code = couponInput.value.trim().toUpperCase();

  if (!code) {
    appliedCoupon = "";
    renderCart();
    return;
  }

  if (VALID_COUPONS[code]) {
    appliedCoupon = code;
    couponInput.value = code;
    renderCart();
    return;
  }

  alert("Cupom inválido.");
}

cards.forEach((card) => {
  const button = card.querySelector("button");
  if (!button) return;

  button.addEventListener("click", () => {
    const { name, price, image, alt } = getCardData(card);
    addToCart(name, price, image, alt);
  });
});

cartItems.addEventListener("click", (event) => {
  const target = event.target.closest("button[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const name = target.dataset.name;

  if (action === "increase") changeItemQty(name, 1);
  else if (action === "decrease") changeItemQty(name, -1);
  else if (action === "remove") removeItem(name);
});

cartIcon.addEventListener("click", () => toggleCart(true));
cartIcon.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleCart(true);
  }
});

cartCloseBtn.addEventListener("click", () => toggleCart(false));
cartOverlay.addEventListener("click", () => toggleCart(false));
cartClearBtn.addEventListener("click", clearCart);
couponApplyBtn.addEventListener("click", applyCoupon);
shippingCalcBtn.addEventListener("click", calculateShippingByCep);

couponInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyCoupon();
});

shippingCepInput.addEventListener("input", () => {
  shippingCepInput.value = maskCep(shippingCepInput.value);
});

shippingCepInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") calculateShippingByCep();
});

paymentMethodInputs.forEach((input) => {
  input.addEventListener("change", () => {
    paymentMethod = input.value;
    renderCart();
  });
});

cardInstallments.addEventListener("change", saveCartState);

cartCheckoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Adicione produtos antes de finalizar.");
    return;
  }
  openCheckoutModal();
  trackEvent("begin_checkout", {
    currency: "BRL",
    value: Number(getCartSubtotal().toFixed(2)),
    item_count: getCartCount()
  });
});

checkoutCloseBtn.addEventListener("click", closeCheckoutModal);
checkoutOverlay.addEventListener("click", closeCheckoutModal);
stepDeliveryTab.addEventListener("click", () => setCheckoutStep("delivery"));
stepPaymentTab.addEventListener("click", () => setCheckoutStep("payment"));
backDeliveryBtn.addEventListener("click", () => setCheckoutStep("delivery"));

checkoutCepInput.addEventListener("input", () => {
  checkoutCepInput.value = maskCep(checkoutCepInput.value);
});

checkoutDocumentInput?.addEventListener("input", () => {
  checkoutDocumentInput.value = maskCpf(checkoutDocumentInput.value);
});

checkoutCalcShippingBtn.addEventListener("click", async () => {
  await calculateShippingByCep(checkoutCepInput.value, checkoutShippingStatus);
  shippingCepInput.value = checkoutCepInput.value;
  updateCheckoutSummary();
});

checkoutCepInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    await calculateShippingByCep(checkoutCepInput.value, checkoutShippingStatus);
    shippingCepInput.value = checkoutCepInput.value;
    updateCheckoutSummary();
  }
});

goPaymentBtn.addEventListener("click", async () => {
  if (!shippingCalculated) {
    await calculateShippingByCep(checkoutCepInput.value, checkoutShippingStatus);
    shippingCepInput.value = checkoutCepInput.value;
    if (!shippingCalculated) {
      return;
    }
  }

  const email = normalizeEmail(checkoutEmailInput.value);
  if (!isValidEmail(email)) {
    alert("Informe um e-mail válido para continuar.");
    return;
  }
  checkoutEmailInput.value = email;

  if (paymentMethod === "pix" && !isValidCpf(checkoutDocumentInput?.value || "")) {
    alert("Informe um CPF válido para pagamento via Pix.");
    checkoutDocumentInput?.focus();
    return;
  }

  updateCheckoutSummary();
  setCheckoutStep("payment");
});

confirmOrderBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }

  if (!shippingCalculated) {
    alert("Calcule o frete para confirmar o pedido.");
    return;
  }

  if (paymentMethod === "pix" && !isValidCpf(checkoutDocumentInput?.value || "")) {
    alert("Para pagar com Pix, informe um CPF válido.");
    setCheckoutStep("delivery");
    checkoutDocumentInput?.focus();
    return;
  }

  const order = createOrder();
  const installmentText = paymentMethod === "card" ? ` em ${cardInstallments.value}x` : "";

  try {
    confirmOrderBtn.disabled = true;
    confirmOrderBtn.textContent = "Gerando pagamento...";

    const payment = await createPaymentSession({
      ...order,
      paymentMethod,
      installments: Number(cardInstallments.value),
    });
    const paymentType = String(payment.paymentType || paymentMethod || "").toLowerCase();
    const isPix = paymentType === "pix";
    const checkoutUrl = payment.checkoutUrl || payment.initPoint || payment.sandboxInitPoint;
    const mappedOrderStatus = mapMpStatusToOrderStatus(payment.status);

    order.mpStatus = String(payment.status || "");
    order.paymentId = String(payment.paymentId || "");
    order.paymentType = paymentType || paymentMethod;
    order.status = mappedOrderStatus || order.status;
    order.paymentLabel = getPaymentLabel();

    if (isPix) {
      if (!payment.qrCode) {
        throw new Error("Pix gerado sem código de pagamento.");
      }

      orderHistory.unshift(order);
      saveOrdersState();

      openPixModal(payment, order);
      alert(
        `Pix gerado com sucesso!\n` +
          `Número: ${order.id}\n` +
          `Total: R$ ${formatPrice(order.total)}\n` +
          `Copie o código Pix ou escaneie o QR Code para pagar.`
      );
    } else {
      if (!checkoutUrl) {
        throw new Error("Checkout do Mercado Pago não retornou link.");
      }

      orderHistory.unshift(order);
      saveOrdersState();

      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      alert(
        `Pedido iniciado!\n` +
          `Número: ${order.id}\n` +
          `Total: R$ ${formatPrice(order.total)}\n` +
          `Pagamento: ${paymentMethod.toUpperCase()}${installmentText}\n` +
          `Continue no checkout seguro para concluir o pagamento.`
      );
    }
  } catch (error) {
    alert(
      `Não foi possível iniciar o pagamento automático agora.\n` +
        `Detalhe: ${error.message}\n\n` +
        `A estrutura está pronta, só falta configurar as chaves do gateway.`
    );
    return;
  } finally {
    confirmOrderBtn.disabled = false;
    confirmOrderBtn.textContent = "Confirmar pedido";
  }

  clearCart();
  appliedCoupon = "";
  couponInput.value = "";
  shippingCalculated = false;
  shippingLocation = "";
  shippingStatusEl.textContent = "Informe seu CEP para calcular o frete.";
  checkoutShippingStatus.textContent = "Calcule o frete para continuar.";
  renderCart();

  closeCheckoutModal();
  trackEvent("begin_checkout", {
    currency: "BRL",
    value: Number(order.total.toFixed(2)),
    payment_type: paymentMethod,
    item_count: order.items.reduce((sum, item) => sum + item.qty, 0)
  });
});

ordersCloseBtn?.addEventListener("click", closeOrdersModal);
ordersOverlay?.addEventListener("click", closeOrdersModal);
openMenuBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleHeaderMenu();
});
headerMenu?.addEventListener("click", (event) => {
  event.stopPropagation();
});
menuOrdersBtn?.addEventListener("click", () => {
  closeHeaderMenu();
  openOrdersModal();
});
openSearchBtn?.addEventListener("click", openSearchModal);
searchCloseBtn?.addEventListener("click", closeSearchModal);
searchOverlay?.addEventListener("click", closeSearchModal);
pixCloseBtn?.addEventListener("click", closePixModal);
pixOverlay?.addEventListener("click", closePixModal);
pixCopyBtn?.addEventListener("click", copyPixCode);
openAccountBtn?.addEventListener("click", () => openAccountModal(currentUser ? null : "login"));
accountCloseBtn?.addEventListener("click", closeAccountModal);
accountOverlay?.addEventListener("click", closeAccountModal);

accountTabLoginBtn?.addEventListener("click", () => {
  setAccountTab("login");
  setAccountFeedback("", "info");
});

accountTabRegisterBtn?.addEventListener("click", () => {
  setAccountTab("register");
  setAccountFeedback("", "info");
});

registerPhoneInput?.addEventListener("input", () => {
  registerPhoneInput.value = maskPhone(registerPhoneInput.value);
});

accountLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = normalizeEmail(loginEmailInput.value);
  const password = String(loginPasswordInput.value || "");

  if (!isValidEmail(email)) {
    setAccountFeedback("Digite um e-mail válido para entrar.", "error");
    return;
  }

  if (!password) {
    setAccountFeedback("Digite sua senha.", "error");
    return;
  }

  const found = accountList.find((account) => normalizeEmail(account.email) === email);
  if (!found || found.password !== password) {
    setAccountFeedback("E-mail ou senha inválidos.", "error");
    return;
  }

  currentUser = {
    name: found.name,
    phone: found.phone || "",
    email: found.email,
  };
  saveAccountSession();
  updateAccountButtonState();
  fillCheckoutFromAccount(true);
  renderAccountModal();
  renderOrders();
  setAccountFeedback("Login realizado com sucesso.", "success");
});

accountRegisterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = String(registerNameInput.value || "").trim();
  const phone = maskPhone(registerPhoneInput.value || "");
  const email = normalizeEmail(registerEmailInput.value);
  const password = String(registerPasswordInput.value || "");
  const passwordConfirm = String(registerPasswordConfirmInput.value || "");

  if (name.length < 3) {
    setAccountFeedback("Digite seu nome completo.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    setAccountFeedback("Digite um e-mail válido para cadastro.", "error");
    return;
  }

  if (accountList.some((account) => normalizeEmail(account.email) === email)) {
    setAccountFeedback("Esse e-mail já está cadastrado. Faça login.", "error");
    setAccountTab("login");
    return;
  }

  if (password.length < 6) {
    setAccountFeedback("A senha precisa ter pelo menos 6 caracteres.", "error");
    return;
  }

  if (password !== passwordConfirm) {
    setAccountFeedback("As senhas não conferem.", "error");
    return;
  }

  const createdAccount = {
    name,
    phone,
    email,
    password,
    createdAt: new Date().toISOString(),
  };

  accountList.unshift(createdAccount);
  saveAccountsState();

  currentUser = {
    name: createdAccount.name,
    phone: createdAccount.phone,
    email: createdAccount.email,
  };
  saveAccountSession();
  updateAccountButtonState();
  fillCheckoutFromAccount(true);
  accountRegisterForm.reset();
  accountLoginForm.reset();
  renderAccountModal();
  renderOrders();
  setAccountFeedback("Conta criada e login feito com sucesso.", "success");
});

accountLogoutBtn?.addEventListener("click", () => {
  currentUser = null;
  saveAccountSession();
  updateAccountButtonState();
  accountLoginForm?.reset();
  accountRegisterForm?.reset();
  setAccountTab("login");
  renderAccountModal();
  renderOrders();
  setAccountFeedback("Você saiu da conta.", "info");
});

searchModalInput?.addEventListener("input", () => {
  updateSearchModal(searchModalInput.value);
});

searchModalInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  event.preventDefault();
  if (searchMatches.length > 0) {
    focusProduct(searchMatches[0]);
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTypingTarget = target instanceof HTMLElement
    && (
      target.tagName === "INPUT"
      || target.tagName === "TEXTAREA"
      || target.tagName === "SELECT"
      || target.isContentEditable
    );

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearchModal();
    return;
  }

  if (event.key === "/" && !isTypingTarget) {
    event.preventDefault();
    openSearchModal();
    return;
  }

  if (event.key === "Escape") {
    closeHeaderMenu();
    closePixModal();
    closeAccountModal();
    closeSearchModal();
    toggleCart(false);
    closeCheckoutModal();
    closeOrdersModal();
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;

  if (headerMenu?.contains(target) || openMenuBtn?.contains(target)) return;
  closeHeaderMenu();
});

window.addEventListener("resize", closeHeaderMenu);
injectProductSchema();
loadAccountsState();
loadAccountSession();
loadOrdersState();
loadRecentSearches();
loadCartState();
updateAccountButtonState();
fillCheckoutFromAccount();
renderAccountModal();
renderCart();
renderOrders();

const animatedElements = document.querySelectorAll(".animar, .animar-direita");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("ativo");
    }
  });
}, { threshold: 0.2 });

animatedElements.forEach((element) => observer.observe(element));
