import re
p = 'profile.html'
s = open(p).read()
log = []

# Helper injected into Alpine — builds the comment link label
helper = r'''
    commentLinkLabel(post) {
      const n = post.comment_count || 0;
      if (n === 0) return '💬 Start a discussion →';
      return '💬 ' + n + ' Comment' + (n === 1 ? '' : 's') + ' →';
    },
    torchLink(post) { return '/torch/' + post.id + '/'; },
'''
anchor = 'function profilePage() {\n  return {\n'
if anchor in s and 'commentLinkLabel(post)' not in s:
    s = s.replace(anchor, anchor + helper, 1)
    log.append('helper methods added')

# ── Audit posts: add comment link after "Visit page" / before closing div
audit_anchor = '''                  <template x-if="post.url && post.domain_mode === 'full'">
                    <a :href="post.url" target="_blank" rel="ugc nofollow noopener"
                       class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:border-orange-500 hover:text-orange-500 transition">Visit page →</a>
                  </template>'''
audit_new = audit_anchor + '''
                  <a :href="torchLink(post)" class="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white transition whitespace-nowrap" x-text="commentLinkLabel(post)"></a>'''
if audit_anchor in s and 'commentLinkLabel(post)"></a>' not in s:
    s = s.replace(audit_anchor, audit_new, 1)
    log.append('audit comment link added')
else:
    log.append('SKIP audit link (anchor missing or already present)')

# ── Discussion posts: add below the images block, before </div></div> of p-5 pb-3
disc_anchor = '''                    </template>
                  </div>
                </div>
              </article>

              <article x-show="post.post_type === 'workflow'"'''
disc_new = '''                    </template>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <a :href="torchLink(post)" class="inline-flex items-center text-xs font-semibold text-orange-500 hover:underline" x-text="commentLinkLabel(post)"></a>
                  </div>
                </div>
              </article>

              <article x-show="post.post_type === 'workflow'"'''
if disc_anchor in s and "post.post_type === 'workflow'" in s:
    s = s.replace(disc_anchor, disc_new, 1)
    log.append('discussion comment link added')
else:
    log.append('SKIP discussion link')

# ── Workflow posts: same pattern
wf_anchor = '''                    </template>
                  </div>
                </div>
              </article>

            </template>'''
wf_new = '''                    </template>
                  </div>
                  <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <a :href="torchLink(post)" class="inline-flex items-center text-xs font-semibold text-purple-500 hover:underline" x-text="commentLinkLabel(post)"></a>
                  </div>
                </div>
              </article>

            </template>'''
if wf_anchor in s:
    s = s.replace(wf_anchor, wf_new, 1)
    log.append('workflow comment link added')
else:
    log.append('SKIP workflow link')

open(p,'w').write(s)
print('Done:')
for x in log: print(' •', x)
