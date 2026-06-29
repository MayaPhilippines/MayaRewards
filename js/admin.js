// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjTn-hyUdZGiDHsy5_ijYu6KQCYMElsTI",
  authDomain: "casinorewards-95502.firebaseapp.com",
  databaseURL: "https://casinorewards-95502-default-rtdb.firebaseio.com",
  projectId: "casinorewards-95502",
  storageBucket: "casinorewards-95502.firebasestorage.app",
  messagingSenderId: "768311187647",
  appId: "1:768311187647:web:f6208b0d80a1c3a2634e0a",
  measurementId: "G-831RDLPWSJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Initializing...');

    // ========== INITIAL AD OVERLAY - Appears after 5 seconds ==========
    const initialAdOverlay = document.getElementById('initialAdOverlay');
    const initialAdClose = document.getElementById('initialAdClose');
    const initialAdCta = document.getElementById('initialAdCta');
    let initialAdShown = false;
    
    // Show initial ad after 5 seconds
    setTimeout(() => {
        if (!initialAdShown && initialAdOverlay) {
            console.log('Showing initial ad');
            initialAdOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            initialAdShown = true;
        }
    }, 5000);
    
    // Close initial ad function
    function closeInitialAd() {
        if (initialAdOverlay) {
            initialAdOverlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                showToast('✨ Check out your exclusive rewards!');
            }, 400);
        }
    }
    
    if (initialAdClose) {
        initialAdClose.addEventListener('click', closeInitialAd);
    }
    
    if (initialAdCta) {
        initialAdCta.addEventListener('click', function() {
            closeInitialAd();
            setTimeout(() => {
                const claimBtn = document.getElementById('claimBtn');
                if (claimBtn) {
                    claimBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    claimBtn.style.boxShadow = '0 0 80px rgba(46, 242, 163, 0.5), 0 0 160px rgba(46, 242, 163, 0.15)';
                    setTimeout(() => {
                        claimBtn.style.boxShadow = '';
                    }, 2000);
                }
            }, 500);
        });
    }
    
    if (initialAdOverlay) {
        initialAdOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeInitialAd();
            }
        });
    }

    // ========== CLAIM POPUP WITH COUNTDOWN ==========
    const claimBtn = document.getElementById('claimBtn');
    const claimPopupOverlay = document.getElementById('claimPopupOverlay');
    const countdownNumber = document.getElementById('countdownNumber');
    const timerValue = document.getElementById('timerValue');
    const countdownProgress = document.getElementById('countdownProgress');
    let countdownInterval = null;
    let popupActive = false;

    console.log('Claim button found:', !!claimBtn);

    // Function to get the latest link
    function getLatestLink() {
        return new Promise((resolve, reject) => {
            database.ref('links').orderByChild('createdAt').limitToLast(1).once('value')
                .then((snapshot) => {
                    const links = snapshot.val();
                    console.log('Links from Firebase:', links);
                    if (!links) {
                        reject(new Error('No active link available. Please deploy a link in the admin panel.'));
                        return;
                    }
                    const linkId = Object.keys(links)[0];
                    const linkData = links[linkId];
                    resolve({ linkId, linkData });
                })
                .catch((error) => {
                    console.error('Error fetching link:', error);
                    reject(error);
                });
        });
    }

    // Function to start countdown
    function startCountdown(linkId, linkData) {
        let count = 5;
        const circumference = 339.292; // 2 * PI * 54
        
        // Set initial state
        if (countdownNumber) countdownNumber.textContent = count;
        if (timerValue) timerValue.textContent = count;
        if (countdownProgress) {
            countdownProgress.style.strokeDashoffset = 0;
        }
        
        // Clear any existing interval
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        countdownInterval = setInterval(() => {
            count--;
            const progress = (count / 5) * circumference;
            if (countdownProgress) {
                countdownProgress.style.strokeDashoffset = circumference - progress;
            }
            if (countdownNumber) countdownNumber.textContent = count;
            if (timerValue) timerValue.textContent = count;
            
            if (count <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                
                console.log('Countdown finished, redirecting...');
                
                // Increment click count
                const newClicks = (linkData.clicks || 0) + 1;
                database.ref('links/' + linkId + '/clicks').set(newClicks)
                    .then(() => {
                        console.log('Click count updated:', newClicks);
                        // Close popup and redirect
                        if (claimPopupOverlay) {
                            claimPopupOverlay.classList.remove('active');
                        }
                        document.body.style.overflow = '';
                        popupActive = false;
                        window.open(linkData.url, '_blank');
                    })
                    .catch((error) => {
                        console.error('Error updating clicks:', error);
                        if (claimPopupOverlay) {
                            claimPopupOverlay.classList.remove('active');
                        }
                        document.body.style.overflow = '';
                        popupActive = false;
                        window.open(linkData.url, '_blank');
                    });
            }
        }, 1000);
    }

    // Function to show popup
    function showPopup(linkId, linkData) {
        if (popupActive) return;
        popupActive = true;
        console.log('Showing popup for link:', linkData.url);
        
        // Reset countdown
        const circumference = 339.292;
        if (countdownProgress) {
            countdownProgress.style.strokeDashoffset = 0;
        }
        if (countdownNumber) countdownNumber.textContent = '5';
        if (timerValue) timerValue.textContent = '5';
        
        if (claimPopupOverlay) {
            claimPopupOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
        
        // Start countdown
        startCountdown(linkId, linkData);
    }

    // Claim button click handler
    if (claimBtn) {
        console.log('Adding click listener to claim button');
        
        claimBtn.addEventListener('click', function(e) {
            console.log('Claim button clicked!');
            
            // Show loading state
            this.classList.add('loading');
            this.innerHTML = '<span class="btn-icon" style="animation: spin 0.8s linear infinite; width:22px;height:22px;display:inline-block;">⟳</span> Processing...';
            
            // Get the latest link from Firebase
            getLatestLink()
                .then(({ linkId, linkData }) => {
                    console.log('Link retrieved successfully:', linkData.url);
                    
                    // Reset button
                    this.classList.remove('loading');
                    this.innerHTML = '<img src="images/maya_icon.png" alt="Maya" class="btn-icon" /> Claim NOW';
                    
                    // Show the popup with countdown
                    showPopup(linkId, linkData);
                })
                .catch((error) => {
                    console.error('Error getting link:', error);
                    
                    // Reset button
                    this.classList.remove('loading');
                    this.innerHTML = '<img src="images/maya_icon.png" alt="Maya" class="btn-icon" /> Claim NOW';
                    
                    showToast('⚠️ ' + error.message, true);
                });
        });
    } else {
        console.error('Claim button not found!');
    }

    // Close popup manually (optional - user can click outside)
    if (claimPopupOverlay) {
        claimPopupOverlay.addEventListener('click', function(e) {
            if (e.target === this && popupActive) {
                // Don't close during countdown to prevent issues
                if (countdownInterval) {
                    showToast('⏳ Please wait for the countdown to finish', true);
                }
            }
        });
    }

    // ========== TOAST FUNCTION ==========
    function showToast(message, isError = false) {
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(3, 8, 7, 0.9);
            backdrop-filter: blur(16px);
            color: #fff;
            padding: 0.8rem 1.5rem;
            border-radius: 16px;
            border: 1px solid ${isError ? 'rgba(255, 50, 50, 0.3)' : 'rgba(46, 242, 163, 0.15)'};
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 9998;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.7);
            animation: toastSlideUp 0.3s ease;
            max-width: 85%;
            text-align: center;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideDown 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // ========== ANIMATION STYLES ==========
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastSlideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        @keyframes toastSlideDown {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
        }
        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
    
    console.log('Script initialized successfully');
});
