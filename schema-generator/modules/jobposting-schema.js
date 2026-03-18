// modules/jobposting-schema.js
// Self-contained JobPosting schema editor & generator for Traffic Torch
// No auto-prefill, starts empty, clean output, mobile-friendly
// Focus on fields required/recommended for Google Job Posting rich results (2026)
import {
  buildJsonLdSkeleton,
  cleanJsonLd,
  prettyJsonLd
} from './schema-base.js';

function render(editorContainer, previewEl) {
  // Education block – current Google JobPosting guidelines
  editorContainer.innerHTML = `
    <div class="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-sm border border-blue-200 dark:border-blue-800">
      <h5 class="font-bold text-lg mb-3 text-blue-700 dark:text-blue-300">About JobPosting Schema</h5>
      <p class="mb-3">Enables rich job listings in Google Search with title, company, location, salary, date posted.</p>
      <ul class="list-disc pl-5 space-y-1.5 text-gray-700 dark:text-gray-300">
        <li>Required: @type="JobPosting", title, description, hiringOrganization, jobLocation, datePosted</li>
        <li>Strongly recommended: employmentType, baseSalary (with currency & value), validThrough</li>
        <li>Google shows rich cards if: public job, clear salary/location, real posting</li>
        <li>2026 best practice: use ISO 8601 dates, only use jobLocationType "TELECOMMUTE" for remote jobs (Google ignores other values)</li>
        <li>Place on individual job listing pages</li>
        <li>Validate with Google Rich Results Test + Job Posting Index in Search Console</li>
        <li>
        <a href="https://traffictorch.net/blog/posts/schema-markup-help-guide#jobposting"
        class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Learn more about JobPosting Schema Markup →
        </a>
       </li>
      </ul>
    </div>
  `;

  // Main form
  editorContainer.insertAdjacentHTML('beforeend', `
    <div class="space-y-10">
      <!-- Core Job Info -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Core Job Information</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Job Title</label>
            <input type="text" data-field="title" placeholder="Senior SEO Specialist" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Job Description (full text)</label>
            <textarea data-field="description" rows="8" placeholder="We are looking for an experienced SEO professional to join our growing team..."
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2 font-medium">Date Posted (ISO 8601)</label>
              <input type="date" data-field="datePosted" required
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Application Deadline (ISO 8601, optional)</label>
              <input type="date" data-field="validThrough"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>
      </div>

      <!-- Hiring Organization -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Hiring Organization</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Company Name</label>
            <input type="text" data-field="hiringOrganization.name" placeholder="Traffic Torch Pty Ltd" required
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Company URL</label>
            <input type="url" data-field="hiringOrganization.url" placeholder="https://traffictorch.net"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Company Logo URL</label>
            <input type="url" data-field="hiringOrganization.logo" placeholder="https://traffictorch.net/logo.png"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Job Location -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Job Location</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Remote / Telecommute? (optional – only use for remote jobs)</label>
            <select data-field="jobLocationType" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="">Not remote (On-site or Hybrid – leave blank)</option>
              <option value="TELECOMMUTE">Yes – Telecommute / Remote</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Google only supports "TELECOMMUTE" for remote jobs. For on-site/hybrid, describe in job description or location fields.</p>
          </div>
          <div>
            <label class="block mb-2 font-medium">City / Remote</label>
            <input type="text" data-field="jobLocation.address.addressLocality" placeholder="Sydney or Remote"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2 font-medium">Country</label>
            <input type="text" data-field="jobLocation.address.addressCountry" placeholder="AU" value="AU"
                   class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Employment Details -->
      <div>
        <h4 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Employment Details</h4>
        <div class="space-y-5">
          <div>
            <label class="block mb-2 font-medium">Employment Type</label>
            <select data-field="employmentType" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="TEMPORARY">Temporary</option>
              <option value="INTERN">Intern</option>
              <option value="VOLUNTEER">Volunteer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block mb-2 font-medium">Salary Currency</label>
              <input type="text" data-field="baseSalary.currency" placeholder="AUD" maxlength="3"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Min Salary (number)</label>
              <input type="number" data-field="baseSalary.value.minValue" placeholder="80000"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block mb-2 font-medium">Max Salary (number, optional)</label>
              <input type="number" data-field="baseSalary.value.maxValue" placeholder="120000"
                     class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div class="mt-5">
            <label class="block mb-2 font-medium">Salary Period</label>
            <select data-field="baseSalary.value.unitText" class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500">
              <option value="">Select period (required for salary)</option>
              <option value="YEAR">Per Year</option>
              <option value="MONTH">Per Month</option>
              <option value="WEEK">Per Week</option>
              <option value="DAY">Per Day</option>
              <option value="HOUR">Per Hour</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `);

  // Live preview
  function updatePreview() {
    const data = {
      title: '',
      description: '',
      datePosted: '',
      validThrough: '',
      employmentType: '',
      hiringOrganization: {
        "@type": "Organization",
        name: '',
        url: '',
        logo: ''
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: '',
          addressCountry: ''
        }
      },
      jobLocationType: '',
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: '',
        value: {
          "@type": "QuantitativeValue",
          minValue: '',
          maxValue: '',
          unitText: ''
        }
      }
    };

    editorContainer.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      const value = el.value.trim();
      if (value) {
        if (field.startsWith('hiringOrganization.')) {
          const key = field.split('.')[1];
          data.hiringOrganization[key] = value;
        } else if (field.startsWith('jobLocation.address.')) {
          const key = field.split('.')[2];
          data.jobLocation.address[key] = value;
        } else if (field.startsWith('baseSalary.')) {
          const parts = field.split('.');
          if (parts.length === 2) {
            data.baseSalary[parts[1]] = value;
          } else if (parts.length === 3 && parts[1] === 'value') {
            data.baseSalary.value[parts[2]] = value;
          }
        } else if (field === 'jobLocationType') {
          data.jobLocationType = value;
        } else {
          data[field] = value;
        }
      }
    });

    // Clean empty nested objects
    if (!data.hiringOrganization.name && !data.hiringOrganization.url && !data.hiringOrganization.logo) {
      delete data.hiringOrganization;
    } else {
      data.hiringOrganization = cleanJsonLd(data.hiringOrganization);
    }

    if (!data.jobLocation.address.addressLocality && !data.jobLocation.address.addressCountry) {
      delete data.jobLocation;
    } else {
      data.jobLocation = cleanJsonLd(data.jobLocation);
    }

    // Only include baseSalary if currency + period + at least one salary value
    if (!data.baseSalary.currency ||
        !data.baseSalary.value.unitText ||
        (!data.baseSalary.value.minValue && !data.baseSalary.value.maxValue)) {
      delete data.baseSalary;
    } else {
      // Clean inner QuantitativeValue if partially empty
      if (!data.baseSalary.value.minValue && !data.baseSalary.value.maxValue) {
        delete data.baseSalary.value;
      } else {
        data.baseSalary.value = cleanJsonLd(data.baseSalary.value);
      }
      data.baseSalary = cleanJsonLd(data.baseSalary);
    }

    const jsonLd = buildJsonLdSkeleton('JobPosting', data);
    previewEl.textContent = prettyJsonLd(cleanJsonLd(jsonLd));
  }

  editorContainer.addEventListener('input', updatePreview);
  editorContainer.addEventListener('change', updatePreview);
  updatePreview();
}

export default { render };