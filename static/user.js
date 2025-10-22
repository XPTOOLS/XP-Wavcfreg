const statsEl = document.getElementById('stats');
const totalEl = document.getElementById('total');
const targetEl = document.getElementById('target');
const formSection = document.getElementById('form-section');
const successSection = document.getElementById('success-section');
const remainingEl = document.getElementById('remaining');
const form = document.getElementById('contact-form');
const warningSection = document.getElementById('warning-section');
const warningMessage = document.getElementById('warning-message');

async function loadStats() {
    try {
        const res = await fetch('/stats');
        const data = await res.json();
        totalEl.textContent = data.total_users;
        targetEl.textContent = data.target;
        if (remainingEl) {
            const rem = data.target - data.total_users;
            if (rem > 0) {
                remainingEl.textContent = `🎯 Only ${rem} more users needed to unlock the VCF file!`;
                remainingEl.style.display = 'block';
            } else {
                remainingEl.style.display = 'none';
            }
        }
    } catch (e) { console.error(e); }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        username: formData.get('username'),
        phone: formData.get('phone')
    };
    try {
        const res = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            formSection.classList.add('hidden');
            setTimeout(() => {
                successSection.classList.add('show');
            }, 300);
            loadStats();
        } else {
            warningMessage.textContent = result.message || 'Submission failed!';
            warningSection.style.display = 'block';
            setTimeout(() => {
                warningSection.style.display = 'none';
            }, 3000); // Hide after 3 seconds
        }
    } catch (e) {
        console.error('Error submitting form:', e);
        warningMessage.textContent = 'An error occurred. Please try again.';
        warningSection.style.display = 'block';
        setTimeout(() => {
            warningSection.style.display = 'none';
        }, 3000);
    }
});

loadStats();
setInterval(loadStats, 12000);