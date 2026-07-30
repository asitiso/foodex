# Foodex Android 빌드·출시 가이드

Foodex Android 앱은 웹 코드를 Capacitor 컨테이너에 담는 구조다. 웹과 앱이 같은 기능 코드를 사용하고, 앱에서는 네이티브 카메라와 진동을 연결한다.

## 준비물

- Node.js 22
- Android Studio와 Android SDK
- JDK 17. Android Studio에 포함된 JDK를 우선 사용한다.
- USB 디버깅을 켠 실제 Android 기기 또는 에뮬레이터

Android Studio에서 `android/` 폴더를 열었을 때 Gradle JDK가 프로젝트 요구 버전과 맞는지 먼저 확인한다.

## 웹 코드 반영

환경 변수를 준비한 뒤 프로젝트 루트에서 실행한다.

```bash
npm install
npm run android:sync
```

`android:sync`는 웹 프로덕션 빌드를 만든 다음 `dist/`를 Android 프로젝트로 복사하고 Capacitor 플러그인을 동기화한다. 웹 코드를 바꾼 뒤에는 반드시 다시 실행한다.

## Android Studio에서 실행

```bash
npm run android:open
```

Android Studio에서 연결한 기기를 선택하고 Run을 누른다. 카메라 권한 요청은 앱을 처음 여는 순간이 아니라 사용자가 식사 촬영 버튼을 누를 때 나타나야 한다.

## 디버그 APK

명령 한 번으로 웹 동기화와 디버그 APK 빌드를 실행한다.

```bash
npm run android:build
```

성공하면 APK는 일반적으로 다음 위치에 생성된다.

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

USB로 연결한 기기에 설치하려면 Android SDK의 `adb`를 사용한다.

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Play Console용 AAB

Android Studio에서 **Build > Generate Signed Bundle / APK > Android App Bundle**을 선택한다. 출시 전에는 고유한 서명 키를 만들고 `release` 빌드를 서명한다.

서명 키와 비밀번호를 분실하면 기존 앱 업데이트가 불가능할 수 있다. 저장소에는 넣지 말고 암호화된 별도 장소 두 곳 이상에 백업한다.

## 출시 전 실제 기기 점검

1. 촬영 버튼을 누를 때만 카메라 권한이 요청되는지 확인한다.
2. 촬영 완료 후 Foodex 기록 화면으로 사진이 돌아오는지 확인한다.
3. 희귀·에픽·전설 카드에서 진동 강도가 달라지는지 확인한다.
4. 설정에서 진동을 끄면 더 이상 진동하지 않는지 확인한다.
5. 앱을 종료했다 열어도 카드, 동료 기록, 효과 설정이 유지되는지 확인한다.
6. 로그인 없이 시작한 익명 사용자의 Supabase 동기화가 작동하는지 확인한다.

## 아이콘과 시작 화면

- 앱 아이콘 리소스: `android/app/src/main/res/mipmap-*`
- 시작 화면 관련 리소스: `android/app/src/main/res/drawable*`
- 앱 이름과 테마: `android/app/src/main/res/values/`

출시용 리소스를 교체한 뒤 Android Studio에서 다양한 해상도와 다크 모드를 확인한다. 카메라 플러그인 권한과 Android 매니페스트 변경도 `android/app/src/main/AndroidManifest.xml`에서 최종 확인한다.
