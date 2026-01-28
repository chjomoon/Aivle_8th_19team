export function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">개인정보처리방침</h1>
                
                <div className="space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제1조 총칙</h2>
                        <p className="leading-relaxed mb-3">
                            자동차 공정 관리 시스템(이하 "회사"라 합니다)은 귀하의 개인정보를 소중하게 생각하며, 
                            이를 효과적으로 관리하고 안전하게 보호하기 위하여 최선의 노력을 다하고 있습니다. 
                            회사는 개인정보 보호법 및 기타 관련 법령을 준수하고 있습니다.
                        </p>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>개인정보란 생존하는 개인에 관한 정보로서 다음의 어느 하나에 해당하는 정보를 말합니다.
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>성명, 주민등록번호 및 영상 등을 통하여 개인을 알아볼 수 있는 정보</li>
                                    <li>해당 정보만으로는 특정 개인을 알아볼 수 없더라도 다른 정보와 쉽게 결합하여 알아볼 수 있는 정보</li>
                                    <li>가명처리함으로써 원래의 상태로 복원하기 위한 추가 정보의 사용·결합 없이는 특정 개인을 알아볼 수 없는 정보(이하 "가명정보"라 합니다)</li>
                                </ul>
                            </li>
                            <li>회사는 귀하의 개인정보를 매우 중요하게 생각하며 개인정보 보호법 및 기타 관련 법령을 준수하고 있습니다.</li>
                            <li>회사는 본 개인정보처리방침을 통하여 귀하의 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.</li>
                            <li>회사의 개인정보처리방침은 관련 법령 및 내부 방침의 변경에 따라 변경될 수 있습니다. 개인정보처리방침이 변경되는 경우에는 변경된 내용을 시행일과 함께 웹사이트에 신속하게 공지합니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제2조 개인정보의 수집 및 이용 목적, 항목, 보유기간</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사는 서비스 제공 및 회원관리를 위하여 필요한 최소한의 개인정보만을 수집합니다.</li>
                            <li>회사는 귀하의 권리, 이익 또는 사생활을 현저하게 침해할 우려가 있는 사상, 정치적 견해, 가족 및 친인척 관계, 학력, 병력 또는 그 밖의 사회활동 경력 등의 개인정보는 수집하지 아니합니다.</li>
                        </ol>
                        <div className="mt-4">
                            <p className="font-semibold mb-3">수집 및 이용 목적과 항목</p>
                            <table className="min-w-full border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 px-4 py-2">수집 및 이용 목적</th>
                                        <th className="border border-gray-300 px-4 py-2">수집 항목</th>
                                        <th className="border border-gray-300 px-4 py-2">보유기간</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2">회원가입 및 관리</td>
                                        <td className="border border-gray-300 px-4 py-2">아이디, 비밀번호, 이메일, 연락처</td>
                                        <td className="border border-gray-300 px-4 py-2">회원탈퇴 시까지</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2">서비스 제공</td>
                                        <td className="border border-gray-300 px-4 py-2">이름, 이메일, 연락처</td>
                                        <td className="border border-gray-300 px-4 py-2">서비스 종료 시까지</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제3조 개인정보의 수집 방법</h2>
                        <p className="leading-relaxed mb-2">회사는 다음의 방법을 통하여 개인정보를 수집합니다.</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>웹사이트를 통한 온라인 회원가입 신청서를 통하여 수집</li>
                            <li>서비스 이용 과정에서 자동으로 생성되어 수집</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제4조 개인정보의 보유 및 이용 기간</h2>
                        <p className="leading-relaxed mb-2">회사는 다음의 기간 동안만 귀하의 개인정보를 보유하고 이용합니다.</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>회원 탈퇴 시까지</li>
                            <li>법령에서 특별한 보존기간을 규정하고 있는 경우에는 해당 기간</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제5조 개인정보의 파기 절차 및 방법</h2>
                        <p className="leading-relaxed mb-2">회사는 원칙적으로 개인정보의 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                        <div className="ml-4 space-y-3">
                            <div>
                                <p className="font-semibold">파기 절차</p>
                                <p className="ml-4 mt-1">수집 및 이용목적이 달성된 후 귀하의 개인정보는 별도의 DB로 옮겨져 일정 기간 저장된 후 파기됩니다.</p>
                            </div>
                            <div>
                                <p className="font-semibold">파기 방법</p>
                                <ul className="list-disc list-inside ml-4 mt-1">
                                    <li>종이에 기재, 인쇄된 개인정보: 분쇄 또는 소각 등의 방법으로 파기</li>
                                    <li>전자적 파일 형태로 저장된 개인정보: 복원이 불가능한 기술적 방법을 사용하여 삭제</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제6조 개인정보의 기술적·관리적 보호</h2>
                        <p className="leading-relaxed mb-3">회사는 귀하의 개인정보를 안전하게 보호하기 위하여 다음과 같은 기술적·관리적 보호조치를 마련하고 있습니다.</p>
                        <div className="ml-4 space-y-3">
                            <div>
                                <p className="font-semibold">기술적 보호조치</p>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                    <li>개인정보는 비밀번호에 의해 보호되며, 중요한 데이터는 파일 및 전송 데이터를 암호화하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 통해 보호됩니다.</li>
                                    <li>백신프로그램을 이용하여 컴퓨터 바이러스에 의한 피해를 방지하기 위한 조치를 취하고 있습니다.</li>
                                    <li>네트워크 상에서 개인정보 및 개인 인증정보를 안전하게 전송할 수 있도록 보안장치(SSL)를 채택하고 있습니다.</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold">관리적 보호조치</p>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                    <li>회사는 개인정보의 안전한 처리를 위한 내부관리계획을 수립하여 임직원이 숙지하도록 하고 준수 여부를 정기적으로 점검하고 있습니다.</li>
                                    <li>개인정보를 처리할 수 있는 자를 최소한으로 제한하고 있으며, 접근 권한을 관리하고 있습니다.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제7조 개인정보 보호책임자 및 연락처</h2>
                        <p className="leading-relaxed mb-3">귀하의 개인정보를 보호하고 개인정보와 관련된 불만 및 문의사항을 처리하기 위하여 회사는 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                        <div className="space-y-3 ml-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-900">개인정보 보호책임자</p>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>• 이름: 김정보 책임자</li>
                                    <li>• 소속: 정보보호팀</li>
                                    <li>• 전화번호: 02-1234-5678</li>
                                    <li>• 이메일: privacy@autoprocess.com</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-900">개인정보 보호담당자</p>
                                <ul className="mt-2 space-y-1 text-sm">
                                    <li>• 이름: 박개인 담당자</li>
                                    <li>• 소속: 정보보호팀</li>
                                    <li>• 전화번호: 02-1234-5679</li>
                                    <li>• 이메일: privacy@autoprocess.com</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제8조 권리침해에 대한 구제방법</h2>
                        <p className="leading-relaxed mb-2">기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>개인정보침해신고센터 (한국인터넷진흥원 운영): privacy.kisa.or.kr / 국번없이 118</li>
                            <li>개인정보 분쟁조정위원회: www.kopico.go.kr / 국번없이 1833-6972</li>
                            <li>대검찰청 사이버수사과: www.spo.go.kr / 국번없이 1301</li>
                            <li>경찰청 사이버안전국: https://ecrm.police.go.kr / 국번없이 182</li>
                        </ul>
                    </section>

                    <section className="mt-8 pt-6 border-t border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제9조 개인정보처리방침 고지</h2>
                        <ul className="list-disc list-inside ml-4">
                            <li>공고일자: 2026년 1월 1일</li>
                            <li>시행일자: 2026년 1월 1일</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
