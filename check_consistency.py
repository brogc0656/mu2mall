#!/usr/bin/env python3
"""
무이몰 웹사이트 일관성 체크 스크립트
Playwright를 사용하여 모든 페이지를 분석하고 불일치 사항을 찾습니다.
"""

from playwright.sync_api import sync_playwright
import json
import re
from datetime import datetime

def analyze_page(page, url, page_name):
    """페이지를 분석하여 주요 정보 추출"""
    print(f"\n{'='*80}")
    print(f"📄 분석 중: {page_name}")
    print(f"{'='*80}")

    page.goto(url)
    page.wait_for_load_state('networkidle')

    # 페이지 전체 텍스트 가져오기
    body_text = page.inner_text('body')

    # 분석 결과 저장
    analysis = {
        'page_name': page_name,
        'url': url,
        'issues': [],
        'info': {}
    }

    # 1. 브랜드명 체크
    print("\n🔍 브랜드명 분석:")
    brand_mentions = {
        '무이상품권': body_text.count('무이상품권'),
        '무이몰': body_text.count('무이몰'),
        'MU2MALL': body_text.count('MU2MALL'),
        '무이상블록': body_text.count('무이상블록')
    }

    for brand, count in brand_mentions.items():
        if count > 0:
            print(f"  - '{brand}': {count}회 발견")
            analysis['info'][f'brand_{brand}'] = count

    # 무이상품권이 남아있는지 체크 (로고 alt 제외)
    if '무이상품권' in body_text:
        # alt 속성이 아닌 실제 텍스트인지 확인
        alt_count = len(re.findall(r'alt="무이상품권"', page.content()))
        text_count = brand_mentions['무이상품권']

        if text_count > alt_count:
            analysis['issues'].append({
                'type': 'brand_inconsistency',
                'severity': 'high',
                'description': f"'무이상품권'이 {text_count}번 발견됨 (alt 속성 {alt_count}개 포함). '무이몰'로 통일 필요"
            })

    # 2. 날짜 체크
    print("\n📅 날짜 분석:")
    date_patterns = [
        r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일',
        r'(\d{4})-(\d{2})-(\d{2})',
        r'공고일자:\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일',
        r'시행일자:\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일'
    ]

    found_dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, body_text)
        for match in matches:
            date_str = '-'.join(match)
            found_dates.append(date_str)
            print(f"  - 발견된 날짜: {date_str}")

    analysis['info']['dates'] = found_dates

    # 날짜 일관성 체크
    unique_dates = set(found_dates)
    if len(unique_dates) > 3:  # 공고일, 시행일, 개업일 등 합리적인 범위 초과
        analysis['issues'].append({
            'type': 'date_inconsistency',
            'severity': 'medium',
            'description': f"여러 다른 날짜 발견: {unique_dates}"
        })

    # 3. 회사 정보 체크
    print("\n🏢 회사 정보 분석:")
    company_info = {
        '사업자등록번호': re.search(r'사업자등록번호[:\s]*([0-9\-]+)', body_text),
        '법인등록번호': re.search(r'법인등록번호[:\s]*([0-9\-]+)', body_text),
        '대표자명': re.search(r'대표자?[:\s]*([가-힣]+)', body_text),
        '전화번호': re.search(r'전화[:\s]*([\d\-]+)', body_text),
        '주소': re.search(r'주소[:\s]*([^\n]+)', body_text)
    }

    for key, match in company_info.items():
        if match:
            value = match.group(1).strip()
            print(f"  - {key}: {value}")
            analysis['info'][key] = value

    # 4. 이메일 주소 체크
    print("\n📧 이메일 주소 분석:")
    emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', body_text)
    unique_emails = set(emails)
    for email in unique_emails:
        print(f"  - {email}")
    analysis['info']['emails'] = list(unique_emails)

    # 5. 링크 체크
    print("\n🔗 링크 분석:")
    links = page.query_selector_all('a[href]')
    broken_links = []

    for link in links[:10]:  # 처음 10개만 체크 (시간 절약)
        href = link.get_attribute('href')
        if href and not href.startswith('#') and not href.startswith('javascript'):
            print(f"  - {href}")

            # 로컬 파일 링크 체크
            if href.endswith('.html'):
                if href.startswith('http'):
                    continue
                # 로컬 파일 존재 여부 체크
                try:
                    test_page = page.context.new_page()
                    test_page.goto(f"file:///Users/hasanghyeon/brother_site/muyi-giftcard/public/{href}", timeout=3000)
                    test_page.close()
                except Exception as e:
                    broken_links.append(href)
                    print(f"    ⚠️ 링크 오류: {str(e)[:50]}")

    if broken_links:
        analysis['issues'].append({
            'type': 'broken_links',
            'severity': 'medium',
            'description': f"깨진 링크: {broken_links}"
        })

    # 6. 로고 이미지 체크
    print("\n🖼️ 로고 이미지 분석:")
    logo_imgs = page.query_selector_all('img[src*="logo"]')
    for img in logo_imgs:
        src = img.get_attribute('src')
        alt = img.get_attribute('alt')
        print(f"  - src: {src}, alt: {alt}")

    # 스크린샷 저장
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    screenshot_path = f"/Users/hasanghyeon/brother_site/muyi-giftcard/screenshots/{page_name}_{timestamp}.png"
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"\n📸 스크린샷 저장: {screenshot_path}")

    return analysis

def main():
    print("🚀 무이몰 웹사이트 일관성 체크 시작")
    print("="*80)

    pages_to_check = [
        {
            'url': 'file:///Users/hasanghyeon/brother_site/muyi-giftcard/public/index.html',
            'name': 'index'
        },
        {
            'url': 'file:///Users/hasanghyeon/brother_site/muyi-giftcard/public/terms.html',
            'name': 'terms'
        },
        {
            'url': 'file:///Users/hasanghyeon/brother_site/muyi-giftcard/public/privacy.html',
            'name': 'privacy'
        },
        {
            'url': 'file:///Users/hasanghyeon/brother_site/muyi-giftcard/public/refund.html',
            'name': 'refund'
        }
    ]

    all_results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        for page_info in pages_to_check:
            try:
                result = analyze_page(page, page_info['url'], page_info['name'])
                all_results.append(result)
            except Exception as e:
                print(f"\n❌ 오류 발생 ({page_info['name']}): {str(e)}")
                all_results.append({
                    'page_name': page_info['name'],
                    'error': str(e),
                    'issues': [{
                        'type': 'error',
                        'severity': 'critical',
                        'description': f"페이지 분석 실패: {str(e)}"
                    }]
                })

        browser.close()

    # 결과 요약
    print("\n" + "="*80)
    print("📊 분석 결과 요약")
    print("="*80)

    total_issues = 0
    critical_issues = 0
    high_issues = 0
    medium_issues = 0

    for result in all_results:
        page_name = result.get('page_name', 'Unknown')
        issues = result.get('issues', [])

        if issues:
            print(f"\n📄 {page_name}:")
            for issue in issues:
                total_issues += 1
                severity = issue.get('severity', 'unknown')

                if severity == 'critical':
                    critical_issues += 1
                    icon = '🔴'
                elif severity == 'high':
                    high_issues += 1
                    icon = '🟠'
                elif severity == 'medium':
                    medium_issues += 1
                    icon = '🟡'
                else:
                    icon = '⚪'

                print(f"  {icon} [{severity.upper()}] {issue.get('description', '')}")
        else:
            print(f"\n✅ {page_name}: 문제 없음")

    print("\n" + "="*80)
    print(f"총 이슈: {total_issues}개")
    print(f"  🔴 Critical: {critical_issues}개")
    print(f"  🟠 High: {high_issues}개")
    print(f"  🟡 Medium: {medium_issues}개")
    print("="*80)

    # JSON 파일로 저장
    report_path = '/Users/hasanghyeon/brother_site/muyi-giftcard/consistency_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"\n📄 상세 리포트 저장: {report_path}")
    print("\n✅ 분석 완료!")

if __name__ == '__main__':
    main()
