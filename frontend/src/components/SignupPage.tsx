import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Factory, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export const SignupPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToAll, setAgreedToAll] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
    const [agreedToMarketing, setAgreedToMarketing] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 전체 동의 처리
    const handleAgreeAll = (checked: boolean) => {
        setAgreedToAll(checked);
        setAgreedToTerms(checked);
        setAgreedToPrivacy(checked);
        setAgreedToMarketing(checked);
    };

    // 개별 체크박스 변경 시 전체 동의 상태 업데이트
    React.useEffect(() => {
        if (agreedToTerms && agreedToPrivacy && agreedToMarketing) {
            setAgreedToAll(true);
        } else {
            setAgreedToAll(false);
        }
    }, [agreedToTerms, agreedToPrivacy, agreedToMarketing]);

    // 비밀번호 유효성 검사 함수
    const validatePassword = (password: string): boolean => {
        if (password.length < 8 || password.length > 16) {
            return false;
        }
        
        let typeCount = 0;
        if (/[a-zA-Z]/.test(password)) typeCount++; // 영문
        if (/[0-9]/.test(password)) typeCount++; // 숫자
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) typeCount++; // 특수문자
        
        return typeCount >= 3;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        // 비밀번호 유효성 검사
        if (!validatePassword(password)) {
            setError('영문, 숫자, 특수문자 중 3종류를 조합하여 8~16자로 구성해주세요');
            return;
        }

        // 개인정보 수집 동의 확인
        if (!agreedToTerms || !agreedToPrivacy) {
            setError('필수 약관에 모두 동의해주세요');
            return;
        }

        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                navigate('/login');
            } else {
                const data = await response.json();
                setError(data.error || '회원가입에 실패했습니다');
            }
        } catch (err) {
            setError('서버 연결에 실패했습니다');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <Factory className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">자동차 공정 관리</h1>
                    <p className="text-slate-300">이상 및 납기 리스크 예측 플랫폼</p>
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">회원가입</h2>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* 약관 동의 섹션 */}
                        <div className="border border-gray-300 rounded-lg p-4 space-y-3">
                            {/* 전체 동의 */}
                            <div className="flex items-center space-x-4 pb-3 border-b border-gray-200">
                                <input
                                    type="checkbox"
                                    id="agree-all"
                                    checked={agreedToAll}
                                    onChange={(e) => handleAgreeAll(e.target.checked)}
                                    className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 relative"
                                    style={{
                                        backgroundImage: agreedToAll ? "url('data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e)" : 'none',
                                        backgroundSize: '100% 100%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                />
                                <label htmlFor="agree-all" className="text-sm font-semibold text-gray-900 cursor-pointer">
                                      서비스 약관에 모두 동의합니다.
                                </label>
                            </div>

                            <div className="text-xs text-gray-600 space-y-1 px-1">
                                <p>- 전체동의 시 필수항목 및 선택사항에 대해 일괄 동의하게 되며, 개별적으로도 동의를 선택하실 수 있습니다.</p>
                                <p>- 선택항목은 서비스 제공을 위해 필요한 항목으로, 동의를 거부하시는 경우 서비스 이용에 제한이 있을 수 있습니다.</p>
                            </div>

                            {/* 개별 약관 동의 */}
                            <div className="space-y-2">
                                {/* 이용약관 동의 */}
                                <div className="border-b border-gray-100 pb-2">
                                    <div className="flex items-center space-x-4 py-2">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 relative"
                                            style={{
                                                backgroundImage: agreedToTerms ? "url('data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e)" : 'none',
                                                backgroundSize: '100% 100%',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        />
                                        <label htmlFor="terms" className="text-sm text-gray-900 cursor-pointer flex-1">
                                            <span className="text-blue-600 font-medium">[필수]</span> 이용약관 동의
                                        </label>
                                    </div>
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="terms" className="border-0">
                                            <AccordionTrigger className="py-2 px-7 text-xs text-gray-500 hover:no-underline">
                                                약관 내용 보기
                                            </AccordionTrigger>
                                            <AccordionContent className="px-7">
                                                <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 rounded text-xs text-gray-600 space-y-2">
                                                    <h4 className="font-semibold">제1조 (목적)</h4>
                                                    <p>본 약관은 자동차 공정 관리 시스템(이하 "회사")이 제공하는 AICE 플랫폼 관련 서비스(이하 "서비스")를 이용함에 있어 회사와 회원과의 권리, 의무, 이용조건 및 절차 등 기본 사항을 규정함을 목적으로 합니다.</p>
                                                    
                                                    <h4 className="font-semibold">제2조 (용어의 정의)</h4>
                                                    <p>1. "서비스"라 함은 회사가 제공하는 자동차 공정 관리 및 이상 예측 관련 모든 서비스를 말합니다.</p>
                                                    <p>2. "회원"이라 함은 본 약관에 따라 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</p>
                                                    
                                                    <h4 className="font-semibold">제3조 (약관의 효력 및 변경)</h4>
                                                    <p>1. 본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.</p>
                                                    <p>2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</p>
                                                    
                                                    <h4 className="font-semibold">제4조 (서비스의 제공 및 변경)</h4>
                                                    <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
                                                    <p>- 자동차 공정 모니터링 서비스</p>
                                                    <p>- 이상 탐지 및 예측 서비스</p>
                                                    <p>- 납기 리스크 분석 서비스</p>
                                                    <p>- 기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</p>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>

                                {/* 개인정보 수집 및 이용 동의 */}
                                <div className="border-b border-gray-100 pb-2">
                                    <div className="flex items-center space-x-4 py-2">
                                        <input
                                            type="checkbox"
                                            id="privacy"
                                            checked={agreedToPrivacy}
                                            onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                                            className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 relative"
                                            style={{
                                                backgroundImage: agreedToPrivacy ? "url('data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e)" : 'none',
                                                backgroundSize: '100% 100%',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        />
                                        <label htmlFor="privacy" className="text-sm text-gray-900 cursor-pointer flex-1">
                                            <span className="text-blue-600 font-medium">[필수]</span> 개인정보 수집 및 이용 동의
                                        </label>
                                    </div>
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="privacy" className="border-0">
                                            <AccordionTrigger className="py-2 px-7 text-xs text-gray-500 hover:no-underline">
                                                약관 내용 보기
                                            </AccordionTrigger>
                                            <AccordionContent className="px-7">
                                                <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 rounded text-xs text-gray-600 space-y-2">
                                                    <h4 className="font-semibold">개인정보 수집 및 이용 내역</h4>
                                                    <table className="min-w-full border border-gray-300 text-xs mt-2">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="border border-gray-300 px-2 py-1">수집 목적</th>
                                                                <th className="border border-gray-300 px-2 py-1">수집 항목</th>
                                                                <th className="border border-gray-300 px-2 py-1">보유기간</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td className="border border-gray-300 px-2 py-1">회원가입 및 관리</td>
                                                                <td className="border border-gray-300 px-2 py-1">아이디, 비밀번호, 이메일</td>
                                                                <td className="border border-gray-300 px-2 py-1">회원탈퇴 시까지</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="border border-gray-300 px-2 py-1">서비스 제공</td>
                                                                <td className="border border-gray-300 px-2 py-1">이름, 연락처</td>
                                                                <td className="border border-gray-300 px-2 py-1">서비스 종료 시까지</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <p className="mt-2">위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 회원가입이 제한됩니다.</p>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>

                                {/* 마케팅 정보 수신 동의 (선택) */}
                                <div className="pb-2">
                                    <div className="flex items-center space-x-4 py-2">
                                        <input
                                            type="checkbox"
                                            id="marketing"
                                            checked={agreedToMarketing}
                                            onChange={(e) => setAgreedToMarketing(e.target.checked)}
                                            className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 relative"
                                            style={{
                                                backgroundImage: agreedToMarketing ? "url('data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e)" : 'none',
                                                backgroundSize: '100% 100%',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        />
                                        <label htmlFor="marketing" className="text-sm text-gray-900 cursor-pointer flex-1">
                                            <span className="text-gray-500 font-medium">[선택]</span> 이벤트, 뉴스 정보 수신 동의
                                        </label>
                                    </div>
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="marketing" className="border-0">
                                            <AccordionTrigger className="py-2 px-7 text-xs text-gray-500 hover:no-underline">
                                                약관 내용 보기
                                            </AccordionTrigger>
                                            <AccordionContent className="px-7">
                                                <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 rounded text-xs text-gray-600 space-y-2">
                                                    <p>서비스와 관련된 신규 기능, 이벤트, 프로모션 등의 정보를 이메일 및 알림으로 받아보실 수 있습니다.</p>
                                                    <p>동의하지 않으셔도 서비스 이용에는 제한이 없으며, 언제든지 마이페이지에서 수신 동의를 변경하실 수 있습니다.</p>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                아이디
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="아이디를 입력하세요"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="비밀번호를 입력하세요"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                영문, 숫자, 특수문자 중 3종류를 조합하여 8~16자로 구성
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호 확인
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="비밀번호를 다시 입력하세요"
                                    required
                                />
                            </div>
                        </div>

                        

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                        >
                            회원가입
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <Link
                            to="/login"
                            className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium block text-center"
                        >
                            이미 계정이 있으신가요? 로그인
                        </Link>
                    </div>
                </div>

                <p className="text-center text-slate-400 text-sm mt-6">
                    © 2026 자동차 공정 관리 시스템. All rights reserved.
                </p>
            </div>
        </div>
    );
};
