document.addEventListener("DOMContentLoaded", () => {
  // --- VIEW TRACKING LOGIC ---
  const TRACKING_API_URL = "https://lens-b-1.onrender.com/api/track-view";
  const VISITOR_ID_KEY = "prompts_visitor_id";

  // Function to generate a simple UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Function to send tracking data to the backend
  const trackView = async (visitorId, pageUrl) => {
    try {
      await fetch(TRACKING_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visitorId, pageUrl }),
      });
    } catch (error) {
      console.error('View tracking failed:', error);
    }
  };
  
  // Main tracking execution
  const runTracker = () => {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = generateUUID();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    trackView(visitorId, window.location.href);
  };
  // --- END OF VIEW TRACKING LOGIC ---


  // --- CONFIG & STATE ---
  const API_URL = "https://lens-b-1.onrender.com/api/images";
  const FIRST_IMAGE_ANIMATION_KEY = "firstImageSwiped";

  let appState = {
    allImages: [],
    filteredImages: [],
    savedItems: new Set(JSON.parse(localStorage.getItem("savedItems")) || []),
    likedItems: new Set(JSON.parse(localStorage.getItem("likedItems")) || []),
    isShowingSaved: false,
  };

  // --- DOM ELEMENTS ---
  const imageContainer = document.getElementById("image-container");
  const loader = document.getElementById("loader");
  const searchInput = document.getElementById("search-input");
  const toast = document.getElementById("toast-notification");
  const menuToggleBtn = document.getElementById("menu-toggle-btn");
  const menuLinks = document.getElementById("menu-links");
  const aboutLink = document.getElementById("about-link");
  const contactLink = document.getElementById("contact-link");
  const overlay = document.getElementById("offcanvas-overlay");
  const aboutPanel = document.getElementById("about-panel");
  const contactPanel = document.getElementById("contact-panel");
  const aiPanel = document.getElementById("ai-panel"); // ✅ new panel
  const closeBtns = document.querySelectorAll(".close-btn");

  // Filter dropdown elements
  const filterDropdownBtn = document.getElementById("filter-dropdown-btn");
  const filterDropdown = document.getElementById("filter-dropdown");
  const dropdownFilterButtons = filterDropdown
    ? filterDropdown.querySelectorAll("button[data-filter-term]")
    : [];
  const savedBtn = document.getElementById("saved-btn");
  const clearFilterBtn = document.getElementById("clear-filter-btn");

  // --- API FUNCTIONS ---
  const api = {
    fetchImages: async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch images:", error);
        if (loader) loader.remove();
        imageContainer.innerHTML = `<div class="message-container"><p>Could not load images.</p></div>`;
        return [];
      }
    },
    likeImage: async (id) => {
      try {
        const response = await fetch(`${API_URL}/${id}/like`, {
          method: "PATCH",
        });
        if (!response.ok) throw new Error("Failed to like image");
        return await response.json();
      } catch (error) {
        console.error("Like Error:", error);
        return null;
      }
    },
    unlikeImage: async (id) => {
      try {
        const response = await fetch(`${API_URL}/${id}/unlike`, {
          method: "PATCH",
        });
        if (!response.ok) throw new Error("Failed to unlike image");
        return await response.json();
      } catch (error) {
        console.error("Unlike Error:", error);
        return null;
      }
    },
  };

  // --- RENDER FUNCTION ---
  const renderImages = (imagesToRender) => {
    if (loader) loader.style.display = "none";
    imageContainer.innerHTML = "";

    if (imagesToRender.length === 0) {
      imageContainer.innerHTML = `<div class="message-container"><p>No images found.</p></div>`;
      return;
    }

    imagesToRender.forEach((image) => {
      const isSaved = appState.savedItems.has(image._id);
      const isLiked = appState.likedItems.has(image._id);
      const section = document.createElement("section");
      section.setAttribute("data-id", image._id);

      const heartIcon = isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";
      const bookmarkIcon = isSaved
        ? "fa-solid fa-bookmark"
        : "fa-regular fa-bookmark";

      section.innerHTML = `
        <img src="${image.afterImage.url}" alt="${image.title}">
        <div class="icons">
          <div class="icon-wrapper ${
            isLiked ? "liked" : ""
          }" data-action="like" data-id="${image._id}">
            <i class="${heartIcon}"></i><span class="like-count">${
        image.likes
      }</span>
          </div>
          <div class="icon-wrapper" data-action="copy" data-description="${
            image.description
          }"><i id="copy" class="fa-solid fa-copy"></i></div>
          <div class="icon-wrapper ${
            isSaved ? "saved" : ""
          }" data-action="save" data-id="${
        image._id
      }"><i class="${bookmarkIcon}"></i></div>
          <div class="icon-wrapper" data-action="share" data-id="${
            image._id
          }" data-title="${
        image.title
      }"><i id="share" class="fa-regular fa-paper-plane"></i></div>
          <div id="ai" class="icon-wrapper">
            <img class="ai-img" src="ai2.png" alt="">
            <h6>Create</h6>
          </div>
                  <a href="index2.html">
                  <div id="gallery" class="icon-wrapper">
                    <div class="imgs">
                      <img class="img1" src="m.jpg" alt="">
                      <img class="img2" src="l.jpg" alt="">
                    </div>
                    <h6>Explore</h6>
                  </div>
                  </a>
        </div>`;

      imageContainer.appendChild(section);
    });

    animateFirstImage();
  };

  // --- ANIMATE FIRST IMAGE ---
  const animateFirstImage = () => {
    const firstSection = document.querySelector("#image-container section");
    if (!firstSection) return;

    if (!localStorage.getItem(FIRST_IMAGE_ANIMATION_KEY)) {
      firstSection.classList.add("bounce-swipe");

      const stopAnimation = () => {
        firstSection.classList.remove("bounce-swipe");
        localStorage.setItem(FIRST_IMAGE_ANIMATION_KEY, "true");
        imageContainer.removeEventListener("scroll", stopAnimation);
        imageContainer.removeEventListener("pointerdown", stopAnimation);
        imageContainer.removeEventListener("touchstart", stopAnimation);
      };

      imageContainer.addEventListener("scroll", stopAnimation, {
        passive: true,
      });
      imageContainer.addEventListener("pointerdown", stopAnimation);
      imageContainer.addEventListener("touchstart", stopAnimation);
    }
  };

  // --- EVENT HANDLERS ---
  const handleContainerClick = async (e) => {
    const wrapper = e.target.closest(".icon-wrapper");
    if (!wrapper) return;
    const { action, id, description, title } = wrapper.dataset;

    // Handle AI panel separately
    if (wrapper.id === "ai") {
      openPanel(aiPanel);
      return;
    }

    switch (action) {
      case "like": {
        const isCurrentlyLiked = appState.likedItems.has(id);
        const likeCountSpan = wrapper.querySelector(".like-count");
        const heartIcon = wrapper.querySelector(".fa-heart");
        let currentLikes = parseInt(likeCountSpan.textContent);

        wrapper.classList.toggle("liked", !isCurrentlyLiked);

        if (isCurrentlyLiked) {
          appState.likedItems.delete(id);
          likeCountSpan.textContent = currentLikes > 0 ? currentLikes - 1 : 0;
          heartIcon.classList.remove("fa-solid");
          heartIcon.classList.add("fa-regular");
          await api.unlikeImage(id);
        } else {
          appState.likedItems.add(id);
          likeCountSpan.textContent = currentLikes + 1;
          heartIcon.classList.add("fa-solid");
          heartIcon.classList.remove("fa-regular");
          await api.likeImage(id);
        }
        localStorage.setItem(
          "likedItems",
          JSON.stringify([...appState.likedItems])
        );
        break;
      }
      case "copy":
        try {
          await navigator.clipboard.writeText(description);
          showToast("Prompt Copied!");
        } catch (err) {
          console.error("Could not copy to clipboard:", err);
          showToast("Failed to copy prompt.");
        }
        break;
      case "save": {
        const isCurrentlySaved = appState.savedItems.has(id);
        const bookmarkIcon = wrapper.querySelector(".fa-bookmark");
        wrapper.classList.toggle("saved", !isCurrentlySaved);

        if (isCurrentlySaved) {
          appState.savedItems.delete(id);
          bookmarkIcon.classList.remove("fa-solid");
          bookmarkIcon.classList.add("fa-regular");
        } else {
          appState.savedItems.add(id);
          bookmarkIcon.classList.add("fa-solid");
          bookmarkIcon.classList.remove("fa-regular");
        }

        localStorage.setItem(
          "savedItems",
          JSON.stringify([...appState.savedItems])
        );

        if (appState.isShowingSaved) {
          const savedImages = appState.allImages.filter((img) =>
            appState.savedItems.has(img._id)
          );
          renderImages(savedImages);
        }
        break;
      }
      case "share": {
        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: title || "Check this out!",
              text: "Found this amazing edit on PromP.ts",
              url: shareUrl,
            });
          } catch (err) {
            console.warn("Share cancelled or failed:", err);
          }
        } else {
          navigator.clipboard.writeText(shareUrl);
          showToast("Link Copied!");
        }
        break;
      }
    }
  };

  const handleFilter = () => {
    searchInput.value = searchInput.value.trim();
    appState.isShowingSaved = false;
    filterDropdown.classList.remove("open");

    const searchTerm = searchInput.value.toLowerCase();
    appState.filteredImages = appState.allImages.filter(
      (img) =>
        img.title.toLowerCase().includes(searchTerm) ||
        img.description.toLowerCase().includes(searchTerm)
    );
    renderImages(appState.filteredImages);
    imageContainer.scrollTop = 0;

    filterDropdownBtn.innerHTML = "Filter";
  };

  const handleDropdownFilter = (e) => {
    const filterTerm = e.currentTarget.dataset.filterTerm;
    if (!filterTerm) return;

    searchInput.value = "";
    appState.isShowingSaved = false;

    appState.filteredImages = appState.allImages.filter((img) =>
      img.title.toLowerCase().includes(filterTerm.toLowerCase())
    );

    filterDropdownBtn.innerHTML = e.currentTarget.innerHTML;

    filterDropdown.classList.remove("open");
    renderImages(appState.filteredImages);
    imageContainer.scrollTop = 0;
  };

  const handleSavedBtnClick = () => {
    searchInput.value = "";
    appState.isShowingSaved = true;

    appState.filteredImages = appState.allImages.filter((img) =>
      appState.savedItems.has(img._id)
    );

    filterDropdownBtn.innerHTML = savedBtn.innerHTML;

    filterDropdown.classList.remove("open");
    renderImages(appState.filteredImages);
    imageContainer.scrollTop = 0;
  };

  const handleClearFilter = () => {
    searchInput.value = "";
    appState.isShowingSaved = false;
    appState.filteredImages = [...appState.allImages];

    filterDropdownBtn.textContent = "Filter";

    filterDropdown.classList.remove("open");
    renderImages(appState.filteredImages);
    imageContainer.scrollTop = 0;
  };

  const toggleFilterDropdown = (e) => {
    e.stopPropagation();
    menuLinks.classList.remove("open");
    filterDropdown.classList.toggle("open");
  };

  // --- UTILITY FUNCTIONS ---
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  };

  const scrollToImage = (id) => {
    const targetSection = document.querySelector(`section[data-id="${id}"]`);
    if (targetSection) targetSection.scrollIntoView({ behavior: "smooth" });
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const openPanel = (panel) => {
    if (panel) panel.classList.add("open");
    if (overlay) overlay.classList.add("open");
  };

  const closePanels = () => {
    if (aboutPanel) aboutPanel.classList.remove("open");
    if (contactPanel) contactPanel.classList.remove("open");
    if (aiPanel) aiPanel.classList.remove("open"); // ✅ close AI panel too
    if (overlay) overlay.classList.remove("open");
  };

  // --- INITIALIZATION ---
  const init = async () => {
    // RUN THE TRACKER ON PAGE LOAD
    runTracker();

    imageContainer.addEventListener("click", handleContainerClick);
    searchInput.addEventListener("input", handleFilter);

    if (savedBtn) savedBtn.addEventListener("click", handleSavedBtnClick);
    if (clearFilterBtn)
      clearFilterBtn.addEventListener("click", handleClearFilter);
    if (filterDropdownBtn)
      filterDropdownBtn.addEventListener("click", toggleFilterDropdown);

    dropdownFilterButtons.forEach((btn) =>
      btn.addEventListener("click", handleDropdownFilter)
    );

    menuToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuLinks.classList.toggle("open");
      filterDropdown.classList.remove("open");
    });

    aboutLink.addEventListener("click", (e) => {
      e.preventDefault();
      openPanel(aboutPanel);
      menuLinks.classList.remove("open");
    });

    contactLink.addEventListener("click", (e) => {
      e.preventDefault();
      openPanel(contactPanel);
      menuLinks.classList.remove("open");
    });

    overlay.addEventListener("click", closePanels);
    closeBtns.forEach((btn) => btn.addEventListener("click", closePanels));

    document.addEventListener("click", (e) => {
      if (!menuToggleBtn.contains(e.target) && !menuLinks.contains(e.target)) {
        menuLinks.classList.remove("open");
      }
      if (
        !filterDropdown.contains(e.target) &&
        !filterDropdownBtn.contains(e.target)
      ) {
        filterDropdown.classList.remove("open");
      }
    });

    let images = await api.fetchImages();
    appState.allImages = shuffleArray(images);

    if (appState.allImages.length > 0) {
      appState.filteredImages = [...appState.allImages];
      renderImages(appState.filteredImages);

      const urlParams = new URLSearchParams(window.location.search);
      const imageIdFromUrl = urlParams.get("id");
      if (imageIdFromUrl) {
        setTimeout(() => {
          scrollToImage(imageIdFromUrl);
          history.replaceState({}, document.title, window.location.pathname);
        }, 500);
      }
    }
  };

  init();
});