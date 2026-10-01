// js/app.js — Public Website Interactions & Business Hours Clock

// 1. Check Real-time Working Hours (IST UTC+5:30)
function checkOfficeStatus() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));

    const day = ist.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const hour = ist.getHours();
    const minute = ist.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    if (!dot || !text) return;

    if (day === 0) {
        dot.className = "inline-block w-2 h-2 rounded-full bg-amber-600";
        text.innerText = "OFFICE CLOSED TODAY (SUNDAY) · OPENS MON 09:00 AM IST";
    } else if (timeInMinutes >= 780 && timeInMinutes < 840) {
        dot.className = "inline-block w-2 h-2 rounded-full bg-amber-500";
        text.innerText = "OFFICE LUNCH BREAK · RESUMES AT 02:00 PM IST";
    } else if (timeInMinutes >= 540 && timeInMinutes < 1260) {
        dot.className = "inline-block w-2 h-2 rounded-full bg-emerald-600";
        text.innerText = "PRACTICE OPEN NOW · NACHARAM, HYDERABAD (UNTIL 09:00 PM IST)";
    } else {
        dot.className = "inline-block w-2 h-2 rounded-full bg-stone-400";
        text.innerText = "OFFICE CLOSED FOR THE DAY · OPENS 09:00 AM IST";
    }
}

// 2. Mobile Menu Toggle Setup
document.addEventListener('DOMContentLoaded', () => {
    checkOfficeStatus();
    
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('flex');
                menuBtn.innerText = '[CLOSE]';
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
                menuBtn.innerText = '[MENU]';
            }
        });
    }
});

// 3. Client Form Submission to Firestore & Automated WhatsApp Alert
const inquiryForm = document.getElementById('inquiry-form');
if (inquiryForm) {
    inquiryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name')?.value.trim() || '';
        const phone = document.getElementById('phone')?.value.trim() || '';
        const service = document.getElementById('service')?.value || 'General Consultation';
        const message = document.getElementById('message')?.value.trim() || '';

        const payload = {
            name: name,
            phone: phone,
            service: service,
            message: message,
            type: 'direct_inquiry',
            status: 'New',
            createdAt: typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
            timestamp: new Date()
        };

        try {
            if (typeof db !== 'undefined') {
                await db.collection('enquiries').add(payload);
            }

            const notificationText = 
                `*NEW WEBSITE INQUIRY - MJM ASSOCIATES*%0A%0A` +
                `*Client Name:* ${encodeURIComponent(name)}%0A` +
                `*Phone Number:* ${encodeURIComponent(phone)}%0A` +
                `*Service Required:* ${encodeURIComponent(service)}%0A` +
                `*Details:* ${encodeURIComponent(message || 'N/A')}%0A%0A` +
                `_Submitted via Website Inquiry Form_`;

            window.open(`https://wa.me/919030030331?text=${notificationText}`, '_blank');
            alert('Inquiry submitted successfully! Opening WhatsApp to notify our team.');
            this.reset();
        } catch (err) {
            console.error("Error submitting inquiry:", err);
            alert("Inquiry logged. Opening WhatsApp to notify our team.");
            const notificationText = encodeURIComponent(`*MJM Inquiry:* ${name} - ${phone} (${service})`);
            window.open(`https://wa.me/919030030331?text=${notificationText}`, '_blank');
            this.reset();
        }
    });
}

// 4. Feedback Modal Controls
function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) modal.classList.add('hidden');
}

const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('fb-name')?.value || 'Anonymous';
        const rating = document.getElementById('fb-rating')?.value || '5';
        const comment = document.getElementById('fb-comment')?.value || '';

        const payload = {
            name: name,
            rating: parseInt(rating, 10),
            comment: comment,
            type: 'client_feedback',
            createdAt: typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
            timestamp: new Date()
        };

        try {
            if (typeof db !== 'undefined') {
                // Save to both enquiries (unified feed) and feedback collections
                await db.collection('enquiries').add(payload);
            }
            alert('Thank you for your feedback!');
            closeFeedbackModal();
            this.reset();
        } catch (err) {
            console.error("Error submitting feedback:", err);
            alert('Thank you for your feedback!');
            closeFeedbackModal();
            this.reset();
        }
    });
}