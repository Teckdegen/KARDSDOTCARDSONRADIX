'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import GlassInput from '@/components/GlassInput';
import GlassButton from '@/components/GlassButton';
import Header from '@/components/Header';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CreateCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phoneCode: '+1',
    phoneNumber: '',
    dateOfBirth: '',
    homeAddressNumber: '',
    homeAddress: '',
    cardName: '',
    cardType: 'virtual',
    cardBrand: 'Visa',
    referralCode: '',
    initialAmount: '15',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          initialAmount: parseFloat(formData.initialAmount),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Card creation initiated! Processing...');
        setTimeout(() => {
          router.push('/cards');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to create card');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = 25; // $10 insurance + $15 to card

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen pb-20 p-3 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <Header title="Create Card" showBack backUrl="/cards" />

        <div className="step-indicator">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`step-dot ${step === i ? 'active' : ''}`}
            />
          ))}
        </div>

        <form onSubmit={handleCreateCard}>
          <GlassCard className="glass-card-reduced p-6 step-form-container">
            {/* Step 1: Phone and Date of Birth */}
            {step === 1 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Phone Code</label>
                    <select
                      value={formData.phoneCode}
                      onChange={(e) => updateFormData('phoneCode', e.target.value)}
                      className="glass-input w-full"
                      required
                    >
                      <option value="+1">+1 (US/Canada)</option>
                      <option value="+7">+7 (Russia/Kazakhstan)</option>
                      <option value="+20">+20 (Egypt)</option>
                      <option value="+27">+27 (South Africa)</option>
                      <option value="+30">+30 (Greece)</option>
                      <option value="+31">+31 (Netherlands)</option>
                      <option value="+32">+32 (Belgium)</option>
                      <option value="+33">+33 (France)</option>
                      <option value="+34">+34 (Spain)</option>
                      <option value="+36">+36 (Hungary)</option>
                      <option value="+39">+39 (Italy)</option>
                      <option value="+40">+40 (Romania)</option>
                      <option value="+41">+41 (Switzerland)</option>
                      <option value="+43">+43 (Austria)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+45">+45 (Denmark)</option>
                      <option value="+46">+46 (Sweden)</option>
                      <option value="+47">+47 (Norway)</option>
                      <option value="+48">+48 (Poland)</option>
                      <option value="+49">+49 (Germany)</option>
                      <option value="+51">+51 (Peru)</option>
                      <option value="+52">+52 (Mexico)</option>
                      <option value="+53">+53 (Cuba)</option>
                      <option value="+54">+54 (Argentina)</option>
                      <option value="+55">+55 (Brazil)</option>
                      <option value="+56">+56 (Chile)</option>
                      <option value="+57">+57 (Colombia)</option>
                      <option value="+58">+58 (Venezuela)</option>
                      <option value="+60">+60 (Malaysia)</option>
                      <option value="+61">+61 (Australia)</option>
                      <option value="+62">+62 (Indonesia)</option>
                      <option value="+63">+63 (Philippines)</option>
                      <option value="+64">+64 (New Zealand)</option>
                      <option value="+65">+65 (Singapore)</option>
                      <option value="+66">+66 (Thailand)</option>
                      <option value="+81">+81 (Japan)</option>
                      <option value="+82">+82 (South Korea)</option>
                      <option value="+84">+84 (Vietnam)</option>
                      <option value="+86">+86 (China)</option>
                      <option value="+90">+90 (Turkey)</option>
                      <option value="+91">+91 (India)</option>
                      <option value="+92">+92 (Pakistan)</option>
                      <option value="+93">+93 (Afghanistan)</option>
                      <option value="+94">+94 (Sri Lanka)</option>
                      <option value="+95">+95 (Myanmar)</option>
                      <option value="+98">+98 (Iran)</option>
                      <option value="+212">+212 (Morocco)</option>
                      <option value="+213">+213 (Algeria)</option>
                      <option value="+216">+216 (Tunisia)</option>
                      <option value="+218">+218 (Libya)</option>
                      <option value="+220">+220 (Gambia)</option>
                      <option value="+221">+221 (Senegal)</option>
                      <option value="+222">+222 (Mauritania)</option>
                      <option value="+223">+223 (Mali)</option>
                      <option value="+224">+224 (Guinea)</option>
                      <option value="+225">+225 (Ivory Coast)</option>
                      <option value="+226">+226 (Burkina Faso)</option>
                      <option value="+227">+227 (Niger)</option>
                      <option value="+228">+228 (Togo)</option>
                      <option value="+229">+229 (Benin)</option>
                      <option value="+230">+230 (Mauritius)</option>
                      <option value="+231">+231 (Liberia)</option>
                      <option value="+232">+232 (Sierra Leone)</option>
                      <option value="+233">+233 (Ghana)</option>
                      <option value="+234">+234 (Nigeria)</option>
                      <option value="+235">+235 (Chad)</option>
                      <option value="+236">+236 (Central African Republic)</option>
                      <option value="+237">+237 (Cameroon)</option>
                      <option value="+238">+238 (Cape Verde)</option>
                      <option value="+239">+239 (São Tomé and Príncipe)</option>
                      <option value="+240">+240 (Equatorial Guinea)</option>
                      <option value="+241">+241 (Gabon)</option>
                      <option value="+242">+242 (Republic of the Congo)</option>
                      <option value="+243">+243 (DR Congo)</option>
                      <option value="+244">+244 (Angola)</option>
                      <option value="+245">+245 (Guinea-Bissau)</option>
                      <option value="+246">+246 (British Indian Ocean Territory)</option>
                      <option value="+248">+248 (Seychelles)</option>
                      <option value="+249">+249 (Sudan)</option>
                      <option value="+250">+250 (Rwanda)</option>
                      <option value="+251">+251 (Ethiopia)</option>
                      <option value="+252">+252 (Somalia)</option>
                      <option value="+253">+253 (Djibouti)</option>
                      <option value="+254">+254 (Kenya)</option>
                      <option value="+255">+255 (Tanzania)</option>
                      <option value="+256">+256 (Uganda)</option>
                      <option value="+257">+257 (Burundi)</option>
                      <option value="+258">+258 (Mozambique)</option>
                      <option value="+260">+260 (Zambia)</option>
                      <option value="+261">+261 (Madagascar)</option>
                      <option value="+262">+262 (Réunion)</option>
                      <option value="+263">+263 (Zimbabwe)</option>
                      <option value="+264">+264 (Namibia)</option>
                      <option value="+265">+265 (Malawi)</option>
                      <option value="+266">+266 (Lesotho)</option>
                      <option value="+267">+267 (Botswana)</option>
                      <option value="+268">+268 (Eswatini)</option>
                      <option value="+269">+269 (Comoros)</option>
                      <option value="+290">+290 (Saint Helena)</option>
                      <option value="+291">+291 (Eritrea)</option>
                      <option value="+297">+297 (Aruba)</option>
                      <option value="+298">+298 (Faroe Islands)</option>
                      <option value="+299">+299 (Greenland)</option>
                      <option value="+350">+350 (Gibraltar)</option>
                      <option value="+351">+351 (Portugal)</option>
                      <option value="+352">+352 (Luxembourg)</option>
                      <option value="+353">+353 (Ireland)</option>
                      <option value="+354">+354 (Iceland)</option>
                      <option value="+355">+355 (Albania)</option>
                      <option value="+356">+356 (Malta)</option>
                      <option value="+357">+357 (Cyprus)</option>
                      <option value="+358">+358 (Finland)</option>
                      <option value="+359">+359 (Bulgaria)</option>
                      <option value="+370">+370 (Lithuania)</option>
                      <option value="+371">+371 (Latvia)</option>
                      <option value="+372">+372 (Estonia)</option>
                      <option value="+373">+373 (Moldova)</option>
                      <option value="+374">+374 (Armenia)</option>
                      <option value="+375">+375 (Belarus)</option>
                      <option value="+376">+376 (Andorra)</option>
                      <option value="+377">+377 (Monaco)</option>
                      <option value="+378">+378 (San Marino)</option>
                      <option value="+380">+380 (Ukraine)</option>
                      <option value="+381">+381 (Serbia)</option>
                      <option value="+382">+382 (Montenegro)</option>
                      <option value="+383">+383 (Kosovo)</option>
                      <option value="+385">+385 (Croatia)</option>
                      <option value="+386">+386 (Slovenia)</option>
                      <option value="+387">+387 (Bosnia and Herzegovina)</option>
                      <option value="+389">+389 (North Macedonia)</option>
                      <option value="+420">+420 (Czech Republic)</option>
                      <option value="+421">+421 (Slovakia)</option>
                      <option value="+423">+423 (Liechtenstein)</option>
                      <option value="+500">+500 (Falkland Islands)</option>
                      <option value="+501">+501 (Belize)</option>
                      <option value="+502">+502 (Guatemala)</option>
                      <option value="+503">+503 (El Salvador)</option>
                      <option value="+504">+504 (Honduras)</option>
                      <option value="+505">+505 (Nicaragua)</option>
                      <option value="+506">+506 (Costa Rica)</option>
                      <option value="+507">+507 (Panama)</option>
                      <option value="+508">+508 (Saint Pierre and Miquelon)</option>
                      <option value="+509">+509 (Haiti)</option>
                      <option value="+590">+590 (Guadeloupe)</option>
                      <option value="+591">+591 (Bolivia)</option>
                      <option value="+592">+592 (Guyana)</option>
                      <option value="+593">+593 (Ecuador)</option>
                      <option value="+594">+594 (French Guiana)</option>
                      <option value="+595">+595 (Paraguay)</option>
                      <option value="+596">+596 (Martinique)</option>
                      <option value="+597">+597 (Suriname)</option>
                      <option value="+598">+598 (Uruguay)</option>
                      <option value="+599">+599 (Curaçao)</option>
                      <option value="+670">+670 (East Timor)</option>
                      <option value="+672">+672 (Antarctica)</option>
                      <option value="+673">+673 (Brunei)</option>
                      <option value="+674">+674 (Nauru)</option>
                      <option value="+675">+675 (Papua New Guinea)</option>
                      <option value="+676">+676 (Tonga)</option>
                      <option value="+677">+677 (Solomon Islands)</option>
                      <option value="+678">+678 (Vanuatu)</option>
                      <option value="+679">+679 (Fiji)</option>
                      <option value="+680">+680 (Palau)</option>
                      <option value="+681">+681 (Wallis and Futuna)</option>
                      <option value="+682">+682 (Cook Islands)</option>
                      <option value="+683">+683 (Niue)</option>
                      <option value="+685">+685 (Samoa)</option>
                      <option value="+686">+686 (Kiribati)</option>
                      <option value="+687">+687 (New Caledonia)</option>
                      <option value="+688">+688 (Tuvalu)</option>
                      <option value="+689">+689 (French Polynesia)</option>
                      <option value="+690">+690 (Tokelau)</option>
                      <option value="+691">+691 (Micronesia)</option>
                      <option value="+692">+692 (Marshall Islands)</option>
                      <option value="+850">+850 (North Korea)</option>
                      <option value="+852">+852 (Hong Kong)</option>
                      <option value="+853">+853 (Macau)</option>
                      <option value="+855">+855 (Cambodia)</option>
                      <option value="+856">+856 (Laos)</option>
                      <option value="+880">+880 (Bangladesh)</option>
                      <option value="+886">+886 (Taiwan)</option>
                      <option value="+960">+960 (Maldives)</option>
                      <option value="+961">+961 (Lebanon)</option>
                      <option value="+962">+962 (Jordan)</option>
                      <option value="+963">+963 (Syria)</option>
                      <option value="+964">+964 (Iraq)</option>
                      <option value="+965">+965 (Kuwait)</option>
                      <option value="+966">+966 (Saudi Arabia)</option>
                      <option value="+967">+967 (Yemen)</option>
                      <option value="+968">+968 (Oman)</option>
                      <option value="+970">+970 (Palestine)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+972">+972 (Israel)</option>
                      <option value="+973">+973 (Bahrain)</option>
                      <option value="+974">+974 (Qatar)</option>
                      <option value="+975">+975 (Bhutan)</option>
                      <option value="+976">+976 (Mongolia)</option>
                      <option value="+977">+977 (Nepal)</option>
                      <option value="+992">+992 (Tajikistan)</option>
                      <option value="+993">+993 (Turkmenistan)</option>
                      <option value="+994">+994 (Azerbaijan)</option>
                      <option value="+995">+995 (Georgia)</option>
                      <option value="+996">+996 (Kyrgyzstan)</option>
                      <option value="+998">+998 (Uzbekistan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Phone Number</label>
                    <GlassInput
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Date of Birth</label>
                    <GlassInput
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {step === 2 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Address Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Address Number</label>
                    <GlassInput
                      placeholder="e.g., 12B, Apt 5"
                      value={formData.homeAddressNumber}
                      onChange={(e) => updateFormData('homeAddressNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Full Address</label>
                    <GlassInput
                      placeholder="Street, City, Country"
                      value={formData.homeAddress}
                      onChange={(e) => updateFormData('homeAddress', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Card Details */}
            {step === 3 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Card Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Card Name</label>
                    <GlassInput
                      placeholder="Name on card"
                      value={formData.cardName}
                      onChange={(e) => updateFormData('cardName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Card Type</label>
                    <select
                      value={formData.cardType}
                      onChange={(e) => updateFormData('cardType', e.target.value)}
                      className="glass-input w-full"
                      required
                    >
                      <option value="virtual">Virtual</option>
                      <option value="physical">Physical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Card Brand</label>
                    <select
                      value={formData.cardBrand}
                      onChange={(e) => updateFormData('cardBrand', e.target.value)}
                      className="glass-input w-full"
                      required
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Referral Code (Optional)</label>
                    <GlassInput
                      placeholder="Enter referral code"
                      value={formData.referralCode}
                      onChange={(e) => updateFormData('referralCode', e.target.value.toLowerCase())}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment and Confirmation */}
            {step === 4 && (
              <div className="step-form-content">
                <h2 className="text-xl font-bold mb-6 text-center">Payment Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Initial Amount (Minimum $15)</label>
                    <GlassInput
                      type="number"
                      placeholder="15"
                      value={formData.initialAmount}
                      onChange={(e) => updateFormData('initialAmount', e.target.value)}
                      min="15"
                      step="0.01"
                      required
                    />
                  </div>

                  <GlassCard className="bg-white/5 border-white/10">
                    <h3 className="text-sm font-semibold mb-3">Payment Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Insurance Fee</span>
                        <span>$10.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Card Balance</span>
                        <span>${parseFloat(formData.initialAmount || '15').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/10 font-semibold">
                        <span>Total</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </GlassCard>

                  {message && (
                    <p
                      className={`text-sm text-center ${
                        message.includes('error') || message.includes('Failed')
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="step-form-actions">
              {step > 1 && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={prevStep}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Back
                </GlassButton>
              )}

              {step < 4 ? (
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={16} />
                </GlassButton>
              ) : (
                <GlassButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  {loading ? 'Creating Card...' : 'Create Card'}
                </GlassButton>
              )}
            </div>
          </GlassCard>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}