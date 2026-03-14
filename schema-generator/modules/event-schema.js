// modules/event-schema.js
// Self-contained Event schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Event rich results (2026)

import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google Event guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About Event Schema</h5>
      <p class="mb-3">Enables rich event cards with date, location, tickets, performers — great for concerts, webinars, workshops.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="Event", name, startDate, location (Place or VirtualLocation)</li>
        <li>Strongly recommended: endDate, eventStatus, eventAttendanceMode, performer/organizer, image</li>
        <li>Google shows rich cards/carousel if: future/upcoming event, clear dates, real ticket/info</li>
        <li>2026 best practice: use ISO 8601 dates, add offers for tickets, multiple images, live stream URLs</li>
        <li>Place on event landing page or dedicated events section</li>
        <li>Validate with Google Rich Results Test</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#event" 
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about Event Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Event Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Event Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Event Name</label>
            <input type="text" data-field="name" placeholder="SEO & UX Masterclass 2026" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Event Description</label>
            <textarea data-field="description" rows="4" placeholder="Full-day workshop on modern SEO, structured data, and user experience best practices..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block mb-2 font-medium">Main Image URL</label>
            <input type="url" data-field="image" placeholder="https://example.com/event-poster.jpg"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Start Date & Time (ISO 8601)</label>
              <input type="datetime-local" data-field="startDate" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">End Date & Time (ISO 8601)</label>
              <input type="datetime-local" data-field="endDate"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Location</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Venue Name</label>
            <input type="text" data-field="location.name" placeholder="Sydney Conference Centre" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Street Address</label>
            <input type="text" data-field="location.address.streetAddress" placeholder="Darling Harbour"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block mb-2 font-medium">City</label>
              <input type="text" data-field="location.address.addressLocality" placeholder="Sydney" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">State</label>
              <input type="text" data-field="location.address.addressRegion" placeholder="NSW" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Country</label>
              <input type="text" data-field="location.address.addressCountry" placeholder="AU" value="AU" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Organizer & Performer -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Organizer & Performers</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Organizer Name</label>
            <input type="text" data-field="organizer.name" placeholder="Traffic Torch Events" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Performer / Speaker Name (optional)</label>
            <input type="text" data-field="performer.name" placeholder="John Smith – SEO Expert"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Optional extras -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Optional Extras</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Event Status</label>
            <select data-field="eventStatus" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="https://schema.org/EventScheduled">Scheduled</option>
              <option value="https://schema.org/EventCancelled">Cancelled</option>
              <option value="https://schema.org/EventPostponed">Postponed</option>
              <option value="https://schema.org/EventRescheduled">Rescheduled</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 font-medium">Attendance Mode</label>
            <select data-field="eventAttendanceMode" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="https://schema.org/OfflineEventAttendanceMode">Offline / In-person</option>
              <option value="https://schema.org/OnlineEventAttendanceMode">Online / Virtual</option>
              <option value="https://schema.org/MixedEventAttendanceMode">Mixed (Online + Offline)</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 font-medium">Ticket URL (optional)</label>
            <input type="url" data-field="offers.url" placeholder="https://example.com/tickets"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>
    </div>
  `);

  // Live preview
  function updatePreview() {
    const data = {
      name: '',
      description: '',
      image: '',
      startDate: '',
      endDate: '',
      eventStatus: '',
      eventAttendanceMode: '',
      location: {
        "@type": "Place",
        name: '',
        address: {
          "@type": "PostalAddress",
          streetAddress: '',
          addressLocality: '',
          addressRegion: '',
          addressCountry: ''
        }
      },
      organizer: { "@type": "Organization", name: '' },
      performer: { "@type": "Person", name: '' },
      offers: { "@type": "Offer", url: '' }
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('location.name')) {
          data.location.name = value;
        } else if (field.startsWith('location.address.')) {
          const key = field.split('.')[2];
          data.location.address[key] = value;
        } else if (field.startsWith('organizer.')) {
          data.organizer[field.split('.')[1]] = value;
        } else if (field.startsWith('performer.')) {
          data.performer[field.split('.')[1]] = value;
        } else if (field.startsWith('offers.')) {
          data.offers[field.split('.')[1]] = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean empty nested objects
    if (!data.location.name && Object.values(data.location.address).every(v => !v)) {
      delete data.location;
    } else {
      data.location = cleanJsonLd(data.location);
    }

    if (!data.organizer.name) delete data.organizer;
    if (!data.performer.name) delete data.performer;
    if (!data.offers.url) delete data.offers;

    const jsonLd = buildJsonLdSkeleton('Event', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };