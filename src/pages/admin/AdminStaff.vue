<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '@/services/api.js'
import { PERMISSIONS } from '@/services/seed.js'
import { useAuthStore } from '@/stores/auth.js'
import { useToastStore } from '@/stores/toast.js'
import { useI18n } from '@/i18n/index.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import ExportMenu from '@/components/ui/ExportMenu.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import InputField from '@/components/ui/InputField.vue'
import AppIcon from '@/components/AppIcon.vue'

const auth = useAuthStore()
const toast = useToastStore()
const { t } = useI18n()

const staff = ref([])
const loading = ref(true)
const busy = ref('')

const blank = () => ({ id: null, name: '', email: '', role: 'staff', permissions: [], active: true })
const form = reactive(blank())
const profile = reactive({ name: auth.user?.name || '', email: auth.user?.email || '', password: '' })

async function load() {
  loading.value = true
  try {
    staff.value = await api.staff.list()
  } catch (e) { toast.error(e.message) } finally { loading.value = false }
}
onMounted(load)

function togglePerm(p) {
  const i = form.permissions.indexOf(p)
  i === -1 ? form.permissions.push(p) : form.permissions.splice(i, 1)
}
function edit(s) {
  Object.assign(form, { ...s, permissions: [...s.permissions] })
}
async function save() {
  if (!form.name.trim() || !form.email.trim()) return toast.error(t('common.required'))
  busy.value = 'save'
  try {
    staff.value = await api.staff.save({ ...form })
    Object.assign(form, blank())
    toast.success(t('admin.saved'))
  } catch (e) { toast.error(e.message) } finally { busy.value = '' }
}
const toDelete = ref(null)
const deleting = ref(false)
async function confirmRemoveStaff() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await api.staff.remove(toDelete.value.id)
    staff.value = staff.value.filter((x) => x.id !== toDelete.value.id)
    toDelete.value = null
  } finally { deleting.value = false }
}
async function toggleActive(s) {
  staff.value = await api.staff.save({ ...s, active: !s.active })
}

async function saveProfile() {
  busy.value = 'profile'
  try {
    await auth.updateProfile({ ...profile, password: profile.password || undefined })
    profile.password = ''
    toast.success(t('account.updated'))
  } catch (e) { toast.error(e.message) } finally { busy.value = '' }
}

const cols = [
  { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'permissions', label: 'Permissions', format: (v) => (v || []).join(' / ') },
]
</script>

<template>
  <div>
    <PageHeader :title="t('nav2.staff')" :count="staff.length">
      <template #actions>
        <ExportMenu filename="vks-staff" :title="t('nav2.staff')" :columns="cols" :rows="staff" />
      </template>
    </PageHeader>

    <div class="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div class="space-y-5">
        <!-- Admin's own profile -->
        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-display font-bold"><AppIcon name="user" :size="18" /> {{ t('admin.adminProfile') }}</h2>
          <div class="mt-4 space-y-3">
            <InputField id="ap-n" v-model="profile.name" :label="t('account.name')" icon="user" />
            <InputField id="ap-e" v-model="profile.email" :label="t('auth.email')" icon="mail" type="email" />
            <InputField id="ap-p" v-model="profile.password" :label="t('account.newPassword')" icon="lock" type="password" :placeholder="t('account.leaveBlank')" />
            <button class="btn btn-primary w-full" :disabled="busy === 'profile'" @click="saveProfile">{{ t('common.save') }}</button>
          </div>
        </section>

        <!-- Staff editor -->
        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-display font-bold">
            <AppIcon name="shieldUser" :size="18" /> {{ form.id ? t('common.edit') : t('common.add') }}
          </h2>
          <div class="mt-4 space-y-3">
            <InputField id="st-n" v-model="form.name" :label="t('account.name')" icon="user" />
            <InputField id="st-e" v-model="form.email" :label="t('auth.email')" icon="mail" type="email" />
            <div>
              <label class="label" for="st-r">Role</label>
              <select id="st-r" v-model="form.role" class="input">
                <option value="manager">Manager</option><option value="staff">Staff</option><option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <p class="label">Permissions</p>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="p in PERMISSIONS" :key="p" type="button" class="chip !px-2.5 !py-1 capitalize"
                        :class="form.permissions.includes(p) && 'chip-active'" @click="togglePerm(p)">{{ p }}</button>
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.active" type="checkbox" class="h-4 w-4 accent-[var(--c-primary)]" /> {{ t('coupon.active') }}
            </label>
            <div class="flex gap-2">
              <button class="btn btn-primary flex-1" :disabled="busy === 'save'" @click="save">{{ t('common.save') }}</button>
              <button v-if="form.id" class="btn btn-outline" @click="Object.assign(form, blank())">{{ t('common.cancel') }}</button>
            </div>
          </div>
        </section>
      </div>

      <section class="card overflow-x-auto">
        <table class="w-full min-w-[640px]">
          <thead class="border-b border-line bg-surface-2">
            <tr><th class="th">Member</th><th class="th">Role</th><th class="th">Permissions</th><th class="th text-right">{{ t('common.actions') }}</th></tr>
          </thead>
          <tbody class="divide-y divide-line-soft">
            <tr v-if="loading"><td colspan="4" class="td py-10 text-center text-muted">{{ t('common.loading') }}</td></tr>
            <tr v-for="s in staff" v-else :key="s.id" class="transition hover:bg-surface-2">
              <td class="td">
                <div class="flex items-center gap-2.5">
                  <span class="flex h-9 w-9 items-center justify-center rounded-[5px] bg-surface-2 text-xs font-bold">{{ s.name.charAt(0) }}</span>
                  <div><p class="font-semibold">{{ s.name }}</p><p class="text-[11px] text-muted">{{ s.email }}</p></div>
                </div>
              </td>
              <td class="td">
                <span class="rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase"
                      :class="s.active ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-muted'">{{ s.role }}</span>
              </td>
              <td class="td">
                <div class="flex flex-wrap gap-1">
                  <span v-for="p in s.permissions" :key="p" class="rounded-[5px] bg-surface-2 px-1.5 py-0.5 text-[10px] capitalize text-muted">{{ p }}</span>
                  <span v-if="!s.permissions.length" class="text-xs text-muted">—</span>
                </div>
              </td>
              <td class="td text-right">
                <button class="rounded-[5px] p-2 text-muted hover:bg-surface-2 hover:text-ink" :aria-label="t('common.edit')" @click="edit(s)"><AppIcon name="edit" :size="15" /></button>
                <button class="rounded-[5px] p-2 text-muted hover:bg-surface-2 hover:text-ink" :aria-label="t('coupon.active')" @click="toggleActive(s)"><AppIcon :name="s.active ? 'eye' : 'lock'" :size="15" /></button>
                <button class="rounded-[5px] p-2 text-muted hover:bg-rose-500/10 hover:text-rose-600" :aria-label="t('common.delete')" @click="toDelete = s"><AppIcon name="trash" :size="15" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <p class="mt-4 text-xs text-muted">
      Staff records define who <em>should</em> have access. Enforcing permissions per route still requires server-side
      checks — the current backend only distinguishes <code>admin</code> from <code>customer</code>.
    </p>

    <ConfirmModal
      :open="!!toDelete"
      :title="`${t('common.delete')} ${toDelete?.name || ''}`"
      :message="t('confirm.generic')"
      :busy="deleting"
      @confirm="confirmRemoveStaff"
      @cancel="toDelete = null"
    />
  </div>
</template>
