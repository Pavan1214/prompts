// --- VIEW TRACKING LOGIC ---
(() => {
    const TRACKING_API_URL = "https://lens-b-1.onrender.com/api/track-view";
    const VISITOR_ID_KEY = "prompts_visitor_id";

    const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    const trackView = async (visitorId, pageUrl) => {
        try {
            await fetch(TRACKING_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    visitorId,
                    pageUrl
                }),
            });
        } catch (error) {
            console.error('View tracking failed:', error);
        }
    };

    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = generateUUID();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    trackView(visitorId, window.location.href);
})();
// --- END OF VIEW TRACKING LOGIC ---


const API_URL = "https://lens-b-1.onrender.com/api/images";
const cardsDisplay = document.getElementById("cardsDisplay");
const searchInput = document.querySelector(".input");

let allImages = []; // This will store the master list of images

// This function renders cards based on an array of image data
function renderImages(imagesToRender) {
    cardsDisplay.innerHTML = ""; // Clear the display first

    if (imagesToRender.length === 0) {
        cardsDisplay.innerHTML =
            '<div class="loading-indicator">No prompts found.</div>';
        return;
    }

    imagesToRender.forEach((item) => {
        // skip if no afterImage
        if (!item.afterImage || !item.afterImage.url) return;

        // Create card
        const card = document.createElement("div");
        card.className = "card";

        // Image
        const img = document.createElement("img");
        img.src = item.afterImage.url;
        img.alt = item.title || "image";
        img.loading = "lazy"; // lazy load images

        // Copy icon
        const copyIcon = document.createElement("i");
        copyIcon.className = "fa-regular fa-copy";

        // Toast for feedback
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerText = "Copied!";

        // Copy functionality
        copyIcon.addEventListener("click", async (e) => {
            e.stopPropagation(); // Prevent any other clicks on the card
            try {
                // Using document.execCommand as a fallback for broader compatibility
                const textToCopy = item.description || "";
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);

                toast.classList.add("show");
                setTimeout(() => toast.classList.remove("show"), 1500);
            } catch (err) {
                console.error("Copy failed", err);
                toast.innerText = "Copy failed!";
                toast.classList.add("show");
                setTimeout(() => {
                    toast.classList.remove("show");
                    toast.innerText = "Copied!";
                }, 1500);
            }
        });

        card.appendChild(img);
        card.appendChild(copyIcon);
        card.appendChild(toast);
        cardsDisplay.appendChild(card);
    });
}

// Fetches all images from the API once
async function loadImages() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        allImages = data; // Store the fetched data in our master array
        renderImages(allImages); // Initial render with all images
    } catch (error) {
        console.error("Error loading images:", error);
        cardsDisplay.innerHTML =
            '<div class="loading-indicator">Failed to load images. Please try again later.</div>';
    }
}

// Add event listener to the search input
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    // Filter the master list of images
    const filteredImages = allImages.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const description = (item.description || "").toLowerCase();
        return title.includes(searchTerm) || description.includes(searchTerm);
    });

    // Re-render the display with only the filtered images
    renderImages(filteredImages);
});

// Initial load of all images
loadImages();


// --- NEW MENU AND MODAL LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    // Get all elements
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    const overlay = document.getElementById('overlay');

    const aboutBtn = document.getElementById('aboutBtn');
    const contactBtn = document.getElementById('contactBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const aiBtn = document.getElementById('aiBtn');
    
    const aboutModal = document.getElementById('aboutModal');
    const contactModal = document.getElementById('contactModal');
    const aiModal = document.getElementById('aiModal');
    const allModals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-btn');

    // --- Helper Functions ---
    const openModal = (modal) => {
        menuDropdown.classList.remove('show'); // Close menu if open
        overlay.classList.add('show');
        modal.classList.add('show');
    };

    const closeModal = () => {
        overlay.classList.remove('show');
        allModals.forEach(modal => modal.classList.remove('show'));
    };

    // --- Event Listeners ---

    // Toggle Hamburger Menu
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from closing menu immediately
        menuDropdown.classList.toggle('show');
    });

    // Open Modals
    aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(aboutModal);
    });

    contactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(contactModal);
    });



    aiBtn.addEventListener('click', () => {
        openModal(aiModal);
    });

    // Reload Button
    reloadBtn.addEventListener('click', () => {
        window.location.reload();
    });

    // Close Modals using close buttons or overlay
    closeButtons.forEach(button => button.addEventListener('click', closeModal));
    overlay.addEventListener('click', closeModal);

    // Close dropdown menu if clicking anywhere else
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
        }
    });
});