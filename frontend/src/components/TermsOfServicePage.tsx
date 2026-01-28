export function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">이용약관</h1>
                
                <div className="space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제1조 (목적)</h2>
                        <p className="leading-relaxed">
                            본 약관은 자동차 공정 관리 시스템(이하 "회사")이 제공하는 AICE 플랫폼 관련 서비스(이하 "서비스")를 이용함에 있어 
                            회사와 회원과의 권리, 의무, 이용조건 및 절차 등 기본 사항을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제2조 (용어의 정의)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>"서비스"라 함은 회사가 제공하는 자동차 공정 관리 및 이상 예측 관련 모든 서비스를 말합니다.</li>
                            <li>"회원"이라 함은 본 약관에 따라 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
                            <li>"아이디(ID)"라 함은 회원의 식별과 서비스 이용을 위하여 회원이 설정하고 회사가 승인한 문자와 숫자의 조합을 말합니다.</li>
                            <li>"비밀번호"라 함은 회원이 부여받은 아이디와 일치되는 회원임을 확인하고 비밀보호를 위해 회원 자신이 정한 문자 또는 숫자의 조합을 말합니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.</li>
                            <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
                            <li>회사가 약관을 변경할 경우에는 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
                            <li>회원은 변경된 약관에 동의하지 않을 경우 회원 탈퇴(해지)를 요청할 수 있으며, 변경된 약관의 효력 발생일 이후에도 서비스를 계속 사용할 경우 약관의 변경 사항에 동의한 것으로 간주됩니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제4조 (서비스의 제공 및 변경)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사는 다음과 같은 서비스를 제공합니다:
                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                                    <li>자동차 공정 모니터링 서비스</li>
                                    <li>이상 탐지 및 예측 서비스</li>
                                    <li>납기 리스크 분석 서비스</li>
                                    <li>데이터 분석 및 리포트 제공 서비스</li>
                                    <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                                </ul>
                            </li>
                            <li>회사는 서비스의 내용 및 제공일자를 제공화면에 게시하거나 기타의 방법으로 회원에게 공지합니다.</li>
                            <li>회사는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제5조 (서비스의 중단)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                            <li>회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제6조 (회원가입)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</li>
                            <li>회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                                    <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                                    <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                                    <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                                </ul>
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제7조 (회원 탈퇴 및 자격 상실)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</li>
                            <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다:
                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                                    <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                                    <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                                    <li>서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                                </ul>
                            </li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제8조 (회원에 대한 통지)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사가 회원에 대한 통지를 하는 경우, 회원이 회사와 미리 약정하여 지정한 이메일 주소로 할 수 있습니다.</li>
                            <li>회사는 불특정다수 회원에 대한 통지의 경우 1주일이상 서비스 게시판에 게시함으로서 개별 통지에 갈음할 수 있습니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제9조 (저작권의 귀속 및 이용제한)</h2>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</li>
                            <li>이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">제10조 (분쟁해결)</h2>
                        <p className="leading-relaxed">
                            서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.
                        </p>
                    </section>

                    <section className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            <strong>부칙</strong><br />
                            본 약관은 2026년 1월 1일부터 시행됩니다.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
