# 🧪 Markdown Viewer 테스트 문서

> 이 문서는 **Markdown Viewer** 확장 프로그램의 렌더링을 테스트하기 위한 샘플 파일입니다.

## 텍스트 서식

일반 텍스트와 **굵은 텍스트**, *기울임 텍스트*, ~~취소선~~ 테스트입니다.
[링크 테스트](https://example.com)도 잘 작동하는지 확인합니다.

`인라인 코드`도 테스트합니다.

## 목록

### 순서 없는 목록
- 첫 번째 항목
- 두 번째 항목
  - 중첩 항목 A
  - 중첩 항목 B
- 세 번째 항목

### 순서 있는 목록
1. 프로젝트 세팅
2. 코드 작성
3. 테스트 및 배포

### 작업 목록 (Task List)
- [x] manifest.json 생성
- [x] Content Script 작성
- [x] CSS 스타일 적용
- [ ] 크롬 웹 스토어 배포

## 코드 블록

```javascript
// JavaScript 코드 하이라이팅 테스트
function greet(name) {
  const message = `안녕하세요, ${name}님!`;
  console.log(message);
  return message;
}

greet('World');
```

```python
# Python 코드 하이라이팅 테스트
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

for num in fibonacci(10):
    print(num)
```

```bash
# 쉘 스크립트 테스트
echo "Hello from Markdown Viewer!"
npm install
npm run build
```

## 테이블

| 기능 | 상태 | 난이도 |
|------|------|--------|
| Markdown 파싱 | ✅ 완료 | 하 |
| 코드 하이라이팅 | ✅ 완료 | 중 |
| 다크 모드 | ✅ 완료 | 하 |
| 자동 새로고침 | ✅ 완료 | 중 |

## 인용문

> 좋은 소프트웨어는 단순함에서 나옵니다.
> — Unknown

## 수평선

---

## 이미지

이미지는 URL을 통해 로드됩니다:

![Markdown Viewer Banner](banner.jpg)

## 키보드 단축키

<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>를 눌러 명령 팔레트를 열 수 있습니다.

---

*Markdown Viewer v1.0.0으로 렌더링됨*
