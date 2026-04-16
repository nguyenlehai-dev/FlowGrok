# FlowGrok Playwright + Chromium Memory Optimization Plan

## 1. Mục tiêu

Tài liệu này phân tích chuyên sâu hướng tối ưu RAM cho hệ thống `FlowGrok` khi vẫn tiếp tục sử dụng `Playwright + Chromium`.

Mục tiêu thực tế:

- Giữ được khả năng automation với `grok.com`
- Không sửa đổi hành vi nghiệp vụ cốt lõi của job
- Giảm số lượng `Chromium renderer` sống quá lâu
- Ngăn tình trạng RAM tăng không kiểm soát khi có nhiều job đồng thời
- Thiết kế lại cơ chế runtime theo hướng `queue + profile pool + bounded concurrency`

Tài liệu này là bản phân tích và kế hoạch kiến trúc, không phải bản code implementation.

## 2. Hiện trạng quan sát từ server

Qua kiểm tra runtime trên server:

- `dev` (`192.168.100.67`) có container `gatewaygrok-api-test` dùng khoảng `10.76 GiB`
- `pro` (`192.168.100.68`) có container `gatewaygrok-api-prod` dùng khoảng `2.13 GiB`
- Nguồn RAM lớn nhất không nằm ở frontend mà nằm trong backend API có chạy `Playwright`
- Các process ngốn RAM lớn nhất là `Chromium renderer`, có process trên `dev` đạt khoảng `6 GiB RSS`
- Có nhiều process `playwright/driver/node` và nhiều tab/session cùng tồn tại trong thời gian dài
- Các command line cho thấy browser đang mở trực tiếp `https://grok.com/` hoặc `https://grok.com/imagine`

Kết luận vận hành:

- Vấn đề chính không phải bản thân `uvicorn`
- Vấn đề chính là số lượng browser runtime sống đồng thời và/hoặc vòng đời browser không được thu gọn
- Hệ thống hiện tại có dấu hiệu thiếu cơ chế quản lý vòng đời `browser/context/page` chặt chẽ

## 3. Chẩn đoán kỹ thuật

## 3.1 Vì sao Chromium ngốn RAM

Với `Playwright + Chromium`, RAM thường tăng mạnh vì các nguyên nhân sau:

- Một `browser` mở quá nhiều `page/tab`
- Một `profile` chạy nhiều job đồng thời trong cùng thời điểm
- Job fail nhưng `page` hoặc `context` không được đóng trong `finally`
- Browser được giữ sống quá lâu nên tích tụ memory fragmentation hoặc memory creep
- Dùng `persistent profile` lâu dài với lượng state/cache lớn
- Website mục tiêu nặng về client-side rendering, animation, canvas, image generation, websocket

Riêng với `grok.com`, mỗi tab có thể nặng hơn web thường vì:

- UI động nhiều
- kết nối thời gian thực
- render media
- giữ nhiều tài nguyên session

## 3.2 Dấu hiệu hiện tại của FlowGrok

Từ runtime snapshot:

- Có nhiều `renderer` cùng lúc cho cùng một profile hoặc cùng một nhóm workload
- Có browser/tab tồn tại hơn `20 phút`, `1 giờ`, thậm chí lâu hơn
- Có profile runtime đang giữ nhiều process con của Chromium

Điều này cho thấy hệ thống hiện tại có khả năng thuộc một trong các kiểu sau:

- `launch browser` quá thường xuyên nhưng không dọn sạch
- tái sử dụng browser/profile nhưng cho quá nhiều tab song song
- thiếu scheduler nên job đến đâu mở browser đến đó
- thiếu `idle shutdown` và `recycle policy`

## 4. Đánh giá ý tưởng đề xuất

Ý tưởng của bạn:

- Mỗi job mở `1 tab`
- Job done hoặc fail thì đóng `tab`
- Nếu số task của profile nhỏ hơn `1` thì đóng browser/profile
- Khi có task mới thì tự mở lại
- `1 profile` phục vụ nhiều job
- Job khác vào phải `queue`
- Cần thuật toán tự chọn profile

Đánh giá tổng thể:

- Đây là hướng đúng
- Nếu triển khai cẩn thận thì có thể giảm RAM rõ rệt
- Tư duy `queue first` là phần quan trọng nhất
- Tư duy `job xong là close tab` là nguyên tắc bắt buộc
- Phần còn thiếu là cách chọn profile, giới hạn đồng thời, và thời điểm đóng browser

## 5. Điểm mạnh của mô hình này

- Giảm số lượng browser sống đồng thời
- Tách được khái niệm `job queue` với `browser runtime`
- Cho phép áp dụng quota theo `profile`
- Có thể reuse session/cookie của profile mà không phải login lại liên tục
- Dễ thêm metric, health score, retry policy
- Dễ scale vì mọi thứ đi qua một scheduler rõ ràng

## 6. Rủi ro nếu áp dụng nguyên bản

Nếu áp dụng y nguyên theo mô tả ban đầu thì có 4 rủi ro chính:

### 6.1 `1 profile = 8 job` có thể vẫn quá cao

Nếu `8 job` nghĩa là `8 tab đồng thời` trong cùng một profile/browser thì RAM vẫn có thể rất lớn.

Với web nhẹ, con số này có thể chấp nhận được.
Với `grok.com`, đây là mức rủi ro cao vì mỗi tab có thể rất nặng.

Khuyến nghị:

- Không hardcode `8` làm giá trị mặc định ban đầu
- Khởi đầu an toàn ở mức `2` hoặc `3`
- Chỉ tăng khi đã có metric xác nhận

### 6.2 Đóng browser ngay khi `task < 1` có thể gây thrash

Nếu job vừa hết là đóng browser ngay:

- job mới vào ngay sau đó lại phải mở lại browser
- tăng CPU
- tăng latency
- tăng lỗi bootstrap session

Khuyến nghị:

- Dùng `idle timeout`
- Ví dụ: profile rỗng thì chờ `60s` hoặc `120s` rồi mới đóng

### 6.3 Round-robin profile chưa đủ tốt

Nếu chỉ “tự đảo profile” theo vòng tròn:

- có thể đẩy job vào profile vừa ngốn RAM cao
- có thể tiếp tục dùng profile đang lỗi
- không phản ánh tải thực tế

Khuyến nghị:

- Dùng scheduler theo tải và health

### 6.4 Chỉ đóng tab là chưa đủ

Nhiều leak xảy ra ở `context`, `browser`, listener, temporary artifact, hoặc watchdog task.

Khuyến nghị:

- Cleanup phải có tầng:
  - đóng `page`
  - dọn job-local resource
  - nếu context là per-job thì đóng `context`
  - browser/profile chỉ giữ lại nếu thực sự còn giá trị reuse

## 7. Kiến trúc đề xuất

## 7.1 Các thành phần chính

- `Job Queue`
- `Scheduler`
- `Profile Manager`
- `Profile Runtime`
- `Browser Lifecycle Manager`
- `Metrics Collector`
- `Cleanup Supervisor`

## 7.2 Mô hình runtime

Mỗi profile nên được xem là một runtime unit:

- có trạng thái riêng
- có browser riêng hoặc context gắn với browser riêng
- có bộ đếm số job đang chạy
- có timestamp hoạt động gần nhất
- có health score

Mỗi job không nên tự quyết định mở browser kiểu ad-hoc.
Thay vào đó, job đi qua scheduler.

## 7.3 Cấu trúc logic đề xuất

```text
Incoming Job
  -> Queue
  -> Scheduler
  -> Pick Profile Runtime
  -> Open Page / Run Job
  -> Close Page
  -> Update Runtime Counters
  -> Idle Timeout / Recycle if needed
```

## 8. Vòng đời tài nguyên

## 8.1 Mức tài nguyên cần phân biệt

Không nên gom tất cả thành một khái niệm “browser”.
Cần tách rõ:

- `Profile`
- `Browser`
- `Context`
- `Page`

## 8.2 Mô hình khuyến nghị

Phương án khả thi nhất cho FlowGrok:

- `Profile` là đơn vị lập lịch
- Mỗi profile có tối đa `1 browser runtime` đang sống tại một thời điểm
- Mỗi job tạo `1 page`
- Sau khi job xong hoặc fail thì `close page`
- Nếu profile không còn job chạy thì bắt đầu `idle timeout`
- Hết `idle timeout` thì đóng `browser`

## 8.3 Khi nào nên đóng `context`

Có 2 hướng:

### Hướng A: `1 persistent context` cho mỗi profile

Ưu điểm:

- giữ được session/cookie/local storage tự nhiên
- tốc độ vào job mới tốt

Nhược điểm:

- dễ phình RAM theo thời gian
- khó cô lập job hoàn toàn

### Hướng B: `1 browser` sống, `1 context` cho mỗi job

Ưu điểm:

- cách ly job tốt hơn
- dọn sạch rõ hơn
- dễ giảm memory creep

Nhược điểm:

- overhead tạo context cao hơn một chút
- cần chiến lược restore state

Khuyến nghị cho case hiện tại:

- Nếu đang ưu tiên giảm RAM và tăng ổn định, nên nghiêng về `context per job`
- Nếu cần giữ session phức tạp theo profile, có thể dùng `persistent context` nhưng phải kèm `recycle policy`

## 9. Queue và giới hạn đồng thời

## 9.1 Queue là bắt buộc

Job browser không nên chạy trực tiếp theo request thời gian thực.
Tất cả job nên đi qua queue để:

- chặn bùng nổ tab đồng thời
- điều phối profile
- áp dụng backpressure
- quan sát tải hệ thống

## 9.2 Ba tầng concurrency nên có

- `system_max_concurrency`
- `profile_max_concurrency`
- `provider_max_concurrency`

Ví dụ:

- Toàn worker chỉ chạy tối đa `6` job browser cùng lúc
- Mỗi profile tối đa `2` job
- Provider `grok` tối đa `4` job đồng thời nếu nó là provider nặng

## 9.3 Khuyến nghị giá trị ban đầu

Không nên bắt đầu bằng `1 profile = 8 job`.
Giá trị khởi đầu an toàn hơn:

- `system_max_concurrency = 3..6`
- `profile_max_concurrency = 1..2`
- `browser_per_profile = 1`

Sau đó dùng metric để tune dần.

## 10. Thuật toán chọn profile

## 10.1 Không nên round-robin thuần

Round-robin chỉ công bằng bề ngoài, nhưng không tối ưu tài nguyên.

Vấn đề:

- profile đang nóng vẫn bị nhồi thêm việc
- profile vừa lỗi xong vẫn tiếp tục nhận job
- profile rảnh thật sự có thể không được ưu tiên

## 10.2 Heuristic đề xuất

Khi scheduler nhận job mới:

1. Lọc các profile hợp lệ theo provider/category
2. Bỏ các profile đang `cooldown`, `recycling`, `failed`, `blocked`
3. Chỉ giữ profile có `active_jobs < max_jobs_per_profile`
4. Ưu tiên profile đang sống sẵn
5. Trong các profile hợp lệ, chọn profile có:
   - `active_jobs` thấp nhất
   - `last_used_at` cũ hơn
   - `health_score` cao hơn
   - `memory_pressure` thấp hơn
6. Nếu không profile nào phù hợp và tổng runtime chưa chạm trần, mở profile mới
7. Nếu không thể mở thêm, đẩy job chờ trong queue

## 10.3 Điểm số profile

Có thể dùng công thức đơn giản:

```text
score =
  active_jobs * 100
  + memory_pressure * 50
  + error_penalty * 1000
  + warm_start_bonus * -20
```

Profile có điểm thấp nhất sẽ được chọn.

Mục đích:

- tránh profile đang nặng RAM
- tránh profile lỗi nhiều
- vẫn tận dụng profile đang warm nếu nó còn khỏe

## 11. Đề xuất state machine cho profile runtime

Các trạng thái nên có:

- `cold`
- `starting`
- `warm`
- `busy`
- `idle`
- `cooling_down`
- `recycling`
- `failed`

Ý nghĩa:

- `cold`: chưa mở browser
- `starting`: đang bootstrap browser/profile
- `warm`: đã sẵn sàng và chưa có job
- `busy`: đang có job chạy
- `idle`: vừa hết job, chờ timeout
- `cooling_down`: chờ đóng sau idle timeout
- `recycling`: đang restart runtime
- `failed`: profile tạm không nhận job

## 12. Chính sách recycle

Ngay cả khi close tab đúng cách, browser vẫn có thể tăng RAM dần theo thời gian.
Do đó cần `recycle policy`.

Khuyến nghị:

- recycle sau `N jobs`
- hoặc sau `T phút`
- hoặc khi vượt `memory threshold`
- hoặc khi số lỗi liên tiếp vượt ngưỡng

Ví dụ:

- `recycle_after_jobs = 20`
- `recycle_after_minutes = 30`
- `recycle_if_profile_rss_mb > 1500`

Mục tiêu:

- ngăn browser sống quá lâu
- reset toàn bộ state nội bộ Chromium

## 13. Cleanup bắt buộc

Mọi job phải có khối cleanup cứng trong `finally`.

Checklist:

- đóng `page`
- hủy timeout/watchdog
- flush artifact/log nếu có
- giải phóng semaphore của profile
- giảm `active_jobs`
- cập nhật `last_used_at`
- nếu `active_jobs == 0` thì bắt đầu idle timer

Nếu job fail giữa chừng mà cleanup không chạy, mọi thiết kế còn lại đều dễ gãy.

## 14. Theo dõi và đo đạc

Không nên tối ưu RAM bằng cảm giác.
Cần metric.

Metric tối thiểu nên có:

- `jobs_running`
- `jobs_queued`
- `profile_active_jobs`
- `profile_state`
- `profile_last_used_at`
- `browser_restart_count`
- `job_duration_seconds`
- `job_fail_count`
- `page_open_count`
- `context_open_count`
- `process_rss_mb`
- `container_memory_mb`

Metric quan trọng nhất cho case này:

- số tab đang mở
- số profile đang sống
- RSS của worker/container
- thời gian sống của browser runtime

## 15. Logging chẩn đoán

Mỗi job nên log:

- `job_id`
- `profile_id`
- `provider`
- `scheduler_decision`
- `browser_runtime_id`
- `page_created_at`
- `page_closed_at`
- `cleanup_status`
- `recycle_reason`

Mỗi profile nên log:

- khi mở browser
- khi chuyển `warm -> busy`
- khi vào `idle`
- khi bị recycle
- khi bị đánh dấu `failed`

## 16. Kế hoạch triển khai theo pha

## 16.1 Pha 1: Chặn nổ RAM nhanh nhất

Mục tiêu:

- không thay đổi kiến trúc quá sâu
- giảm ngay số browser/tab đồng thời

Việc cần làm:

- ép mọi job đi qua queue
- đóng `page` cứng ở `finally`
- thêm `profile_max_concurrency = 1`
- thêm `system_max_concurrency`
- thêm `idle timeout`

## 16.2 Pha 2: Thêm scheduler profile

Mục tiêu:

- tránh phân phối job ngẫu nhiên

Việc cần làm:

- tạo `ProfileManager`
- thêm state machine
- thêm heuristic chọn profile
- thêm cooldown cho profile lỗi

## 16.3 Pha 3: Recycle và observability

Mục tiêu:

- xử lý memory creep dài hạn

Việc cần làm:

- recycle browser định kỳ
- thêm metric và dashboard
- log nguyên nhân recycle
- theo dõi RSS per runtime

## 16.4 Pha 4: Tuning theo thực tế

Mục tiêu:

- tăng throughput nhưng không vượt ngưỡng RAM

Việc cần làm:

- thử tăng `profile_max_concurrency` từ `1` lên `2`
- đo RAM, CPU, success rate
- nếu ổn mới cân nhắc tăng tiếp

## 17. Quy tắc cấu hình đề xuất

Nên đưa các giá trị sau thành config:

- `SYSTEM_MAX_CONCURRENCY`
- `PROFILE_MAX_CONCURRENCY_DEFAULT`
- `PROFILE_IDLE_TIMEOUT_SECONDS`
- `PROFILE_RECYCLE_AFTER_JOBS`
- `PROFILE_RECYCLE_AFTER_MINUTES`
- `PROFILE_MEMORY_SOFT_LIMIT_MB`
- `PROFILE_STARTUP_TIMEOUT_SECONDS`
- `JOB_TIMEOUT_SECONDS`

Mục tiêu là không hardcode chiến lược vận hành vào code.

## 18. Đề xuất cấu hình khởi đầu cho FlowGrok

Đây là bộ giá trị an toàn để bắt đầu:

- `SYSTEM_MAX_CONCURRENCY = 3`
- `PROFILE_MAX_CONCURRENCY_DEFAULT = 1`
- `PROFILE_IDLE_TIMEOUT_SECONDS = 60`
- `PROFILE_RECYCLE_AFTER_JOBS = 15`
- `PROFILE_RECYCLE_AFTER_MINUTES = 20`
- `PROFILE_MEMORY_SOFT_LIMIT_MB = 1200`

Sau 3 đến 5 ngày có metric thật mới cân nhắc tăng tải.

## 19. Quan điểm về `1 profile 8 job`

Về mặt ý tưởng, `1 profile 8 job` không sai nếu hiểu là năng lực tối đa lý thuyết.
Nhưng với runtime hiện tại của `grok.com`, đây không nên là mặc định.

Lý do:

- mỗi tab Chromium có thể rất nặng
- memory spike không tăng tuyến tính đẹp
- chỉ cần một renderer bất thường là đủ đẩy container vượt ngưỡng

Khuyến nghị:

- xem `8` là trần xa về sau
- bắt đầu với `1` hoặc `2`
- tăng theo dữ liệu, không tăng theo cảm giác

## 20. Kiến nghị cuối cùng

Nếu chọn một hướng cân bằng giữa độ đơn giản và hiệu quả, kiến nghị như sau:

1. Tất cả job phải đi qua queue
2. Mỗi profile có tối đa `1 browser runtime`
3. Mỗi job chỉ mở `1 page`
4. Job xong hoặc fail thì `close page` trong `finally`
5. Mỗi profile chỉ chạy `1` job lúc đầu
6. Nếu profile rỗng thì chờ `idle timeout` rồi đóng browser
7. Scheduler chọn profile theo tải thấp nhất và health score
8. Browser/profile được recycle định kỳ
9. Có metric RAM, số tab mở, số profile sống, số job đang chạy

Đây là mô hình thực dụng nhất để giữ `Playwright + Chromium` sống được lâu mà không để RAM phình vô hạn.

## 21. Tiêu chí hoàn thành

Khi implementation hoàn tất, hệ thống nên đạt được các tiêu chí sau:

- Không còn trường hợp số tab tăng mất kiểm soát
- Không còn browser sống vô thời hạn mà không có job
- Container không còn tăng RAM liên tục chỉ vì chạy lâu
- Job fail vẫn cleanup sạch
- Có thể giải thích được vì sao một job được gán vào profile nào
- Có thể tune concurrency bằng config thay vì sửa code

## 22. Kết luận

Ý tưởng gốc của bạn là đúng hướng và đủ tốt để trở thành nền tảng thiết kế mới.
Phần cần nâng cấp không nằm ở việc “có dùng Playwright nữa hay không”, mà nằm ở:

- quản lý vòng đời browser
- giới hạn số job đồng thời
- lập lịch profile theo tải
- recycle runtime có chủ đích

Nếu triển khai đúng, hệ thống vẫn dùng được `Playwright + Chromium`, vẫn giữ được session theo profile, nhưng RAM sẽ ổn định hơn rất nhiều so với cách mở browser/tab tự do.
